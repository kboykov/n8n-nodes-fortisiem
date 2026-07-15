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

// Serialize a query object, expanding arrays into repeated keys (?k=a&k=b),
// which is how FortiSIEM's OpenAPI array parameters are defined (explode=true).
function buildQueryString(qs: IDataObject): string {
	const parts: string[] = [];
	const add = (key: string, value: unknown) => {
		if (value === undefined || value === null || value === '') return;
		parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
	};
	for (const [key, value] of Object.entries(qs)) {
		if (Array.isArray(value)) {
			for (const item of value) add(key, item);
		} else {
			add(key, value);
		}
	}
	return parts.length ? `?${parts.join('&')}` : '';
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
	const authHeaders = await buildAuthHeaders(this, credentials);

	const query = options.qs ? buildQueryString(options.qs) : '';

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}${query}`,
		headers: {
			Accept: 'application/json',
			...(options.contentType ? { 'Content-Type': options.contentType } : {}),
			...(options.headers ?? {}),
			...authHeaders,
		},
		body: options.body,
		json: false,
		skipSslCertificateValidation: credentials.allowUnauthorizedCerts,
	};

	try {
		const response = await this.helpers.httpRequest(requestOptions);
		return options.raw ? response : parseResponse(response);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

// Multipart/form-data upload (Case attachment, Lookup Table import). Uses the legacy
// request helper because it handles multipart streaming for binary payloads.
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

// Split a comma-separated string into a list of numbers (drops non-numeric entries).
export function splitNumberList(value: string): number[] {
	return splitList(value)
		.map((part) => Number(part))
		.filter((part) => !Number.isNaN(part));
}
