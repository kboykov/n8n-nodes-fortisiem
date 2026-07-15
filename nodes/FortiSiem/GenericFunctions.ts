import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export interface FortiSiemCredentials {
	baseUrl: string;
	authentication: 'basicAuth' | 'accessToken';
	username?: string;
	password?: string;
	clientId?: string;
	clientSecret?: string;
	allowUnauthorizedCerts: boolean;
}

export interface FortiSiemRequestOptions {
	body?: IDataObject | IDataObject[] | string | number[];
	qs?: IDataObject;
	contentType?: string;
	headers?: IDataObject;
	// Return the raw response instead of the JSON-parsed body (used for text/plain endpoints)
	raw?: boolean;
}

// Access tokens are cached per base URL + client ID for the lifetime of the process
// so we do not exchange credentials on every single request.
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.replace(/\/$/, '');
}

// Drop empty query values so optional parameters are omitted instead of sent as "key=".
function cleanQuery(qs: IDataObject): IDataObject {
	const cleaned: IDataObject = {};
	for (const [key, value] of Object.entries(qs)) {
		if (value === undefined || value === null || value === '') continue;
		cleaned[key] = value;
	}
	return cleaned;
}

async function getAccessToken(
	ctx: IExecuteFunctions,
	credentials: FortiSiemCredentials,
): Promise<string> {
	const baseUrl = normalizeBaseUrl(credentials.baseUrl);
	const cacheKey = `${baseUrl}::${credentials.clientId}`;
	const cached = tokenCache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.token;
	}

	const form = new URLSearchParams({
		grant_type: 'client_credentials',
		client_id: credentials.clientId ?? '',
		client_secret: credentials.clientSecret ?? '',
	}).toString();

	const response = (await ctx.helpers.httpRequest({
		method: 'POST',
		url: `${baseUrl}/phoenix/rest/pub/security/oauth/token`,
		body: form,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		},
		skipSslCertificateValidation: credentials.allowUnauthorizedCerts,
		json: true,
	})) as IDataObject;

	const token = (response.access_token ?? response.token) as string | undefined;
	if (!token) {
		throw new NodeApiError(ctx.getNode(), response as JsonObject, {
			message: 'FortiSIEM did not return an access token',
		});
	}

	const expiresIn = Number(response.expires_in ?? 3600);
	// Refresh a minute early to avoid using a token that expires mid-request.
	tokenCache.set(cacheKey, {
		token,
		expiresAt: Date.now() + Math.max(expiresIn - 60, 30) * 1000,
	});

	return token;
}

async function buildAuthHeaders(
	ctx: IExecuteFunctions,
	credentials: FortiSiemCredentials,
): Promise<IDataObject> {
	if (credentials.authentication === 'accessToken') {
		const token = await getAccessToken(ctx, credentials);
		return { Authorization: `Bearer ${token}` };
	}
	const basic = Buffer.from(`${credentials.username ?? ''}:${credentials.password ?? ''}`).toString(
		'base64',
	);
	return { Authorization: `Basic ${basic}` };
}

// FortiSIEM returns most payloads as text/plain even when the content is JSON or XML,
// so parse JSON ourselves and fall back to the raw string when it is not JSON.
export function parseResponse(response: unknown): IDataObject | IDataObject[] {
	if (response === undefined || response === null) {
		return { success: true };
	}
	if (typeof response !== 'string') {
		return response as IDataObject | IDataObject[];
	}
	const trimmed = response.trim();
	if (trimmed === '') {
		return { success: true };
	}
	try {
		return JSON.parse(trimmed) as IDataObject | IDataObject[];
	} catch {
		return { data: response };
	}
}

export async function fortiSiemApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	options: FortiSiemRequestOptions = {},
): Promise<unknown> {
	const credentials = (await this.getCredentials('fortiSiemApi')) as unknown as FortiSiemCredentials;
	const baseUrl = normalizeBaseUrl(credentials.baseUrl);

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: {
			Accept: 'application/json',
			...(options.contentType ? { 'Content-Type': options.contentType } : {}),
			...(options.headers ?? {}),
		},
		qs: options.qs ? cleanQuery(options.qs) : undefined,
		// FortiSIEM's OpenAPI defines array parameters as repeated keys (?k=a&k=b)
		arrayFormat: 'repeat',
		body: options.body,
		json: false,
		skipSslCertificateValidation: credentials.allowUnauthorizedCerts,
	};

	// A cached bearer token can be revoked server-side before it expires locally,
	// so retry exactly once with a freshly exchanged token on 401.
	for (let attempt = 0; ; attempt++) {
		try {
			const authHeaders = await buildAuthHeaders(this, credentials);
			requestOptions.headers = { ...requestOptions.headers, ...authHeaders };
			const response = await this.helpers.httpRequest(requestOptions);
			return options.raw ? response : parseResponse(response);
		} catch (error) {
			const errObj = error as {
				response?: { status?: number };
				httpCode?: string;
				statusCode?: number;
			};
			const status = Number(errObj.response?.status ?? errObj.httpCode ?? errObj.statusCode);
			if (attempt === 0 && status === 401 && credentials.authentication === 'accessToken') {
				tokenCache.delete(`${baseUrl}::${credentials.clientId}`);
				continue;
			}
			if (error instanceof NodeApiError) throw error;
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}
}

// Multipart/form-data upload (Case attachment, Lookup Table import). Uses the legacy
// request helper because it handles multipart streaming for binary payloads: the modern
// httpRequest helper types multipart bodies as `form-data` package instances, which a
// zero-dependency community node cannot construct.
export async function fortiSiemApiRequestFormData(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	formData: IDataObject,
): Promise<unknown> {
	const credentials = (await this.getCredentials('fortiSiemApi')) as unknown as FortiSiemCredentials;
	const baseUrl = normalizeBaseUrl(credentials.baseUrl);
	const authHeaders = await buildAuthHeaders(this, credentials);

	const requestOptions: IRequestOptions = {
		method,
		uri: `${baseUrl}${endpoint}`,
		headers: {
			Accept: 'application/json',
			...authHeaders,
		},
		formData,
		rejectUnauthorized: !credentials.allowUnauthorizedCerts,
	};

	try {
		const response = await this.helpers.request(requestOptions);
		return parseResponse(response);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

// Split a comma-separated string into a trimmed, non-empty list of strings.
export function splitList(value: string): string[] {
	return value
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part !== '');
}

// Split a comma-separated string into a list of numbers. Throws on non-numeric entries
// instead of dropping them silently — several callers use the result for delete operations.
export function splitNumberList(value: string): number[] {
	return splitList(value).map((part) => {
		const num = Number(part);
		if (Number.isNaN(num)) {
			throw new Error(`The value "${part}" in the ID list "${value}" is not a number`);
		}
		return num;
	});
}
