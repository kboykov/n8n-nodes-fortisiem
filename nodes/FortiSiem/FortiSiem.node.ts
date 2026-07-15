import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { eventFields, eventOperations } from './descriptions/EventDescription';
import { incidentFields, incidentOperations } from './descriptions/IncidentDescription';
import {
	organizationFields,
	organizationOperations,
} from './descriptions/OrganizationDescription';
import { watchlistFields, watchlistOperations } from './descriptions/WatchlistDescription';

interface FortiSiemCredentials {
	baseUrl: string;
	username: string;
	password: string;
	allowUnauthorizedCerts: boolean;
}

// FortiSIEM returns most payloads as text/plain even though the body is JSON,
// so parse it ourselves and fall back to the raw string when it isn't JSON.
function parseResponse(response: unknown): IDataObject | IDataObject[] {
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

// Split a comma-separated string into a trimmed, non-empty list.
function splitList(value: string): string[] {
	return value
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part !== '');
}

export class FortiSiem implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FortiSIEM',
		name: 'fortiSiem',
		icon: 'file:../../icons/fortisiem.png',
		// 'input' is correct for nodes that fetch / mutate data in an external system
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the FortiSIEM security information and event management platform',
		defaults: {
			name: 'FortiSIEM',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'fortiSiemApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Event',
						value: 'event',
						description: 'Run analytic queries against collected events',
					},
					{
						name: 'Incident',
						value: 'incident',
						description: 'Fetch, inspect and update incidents',
					},
					{
						name: 'Organization',
						value: 'organization',
						description: 'Manage monitored organizations',
					},
					{
						name: 'Watchlist',
						value: 'watchlist',
						description: 'Manage watchlists and their entries',
					},
				],
				default: 'incident',
			},

			// ── Operations (one block per resource) ─────────────────────
			...eventOperations,
			...incidentOperations,
			...organizationOperations,
			...watchlistOperations,

			// ── Fields (one block per resource) ─────────────────────────
			...eventFields,
			...incidentFields,
			...organizationFields,
			...watchlistFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = (await this.getCredentials('fortiSiemApi')) as unknown as FortiSiemCredentials;
		const baseUrl = credentials.baseUrl.replace(/\/$/, '');

		// Typed helper — authentication (Basic auth) is injected via the credential.
		const makeRequest = async (
			method: IHttpRequestMethods,
			path: string,
			options: {
				body?: IDataObject | string;
				qs?: IDataObject;
				contentType?: string;
				json?: boolean;
			} = {},
		): Promise<unknown> => {
			const requestOptions: IHttpRequestOptions = {
				method,
				url: `${baseUrl}${path}`,
				headers: {
					Accept: 'application/json',
					...(options.contentType ? { 'Content-Type': options.contentType } : {}),
				},
				qs: options.qs && Object.keys(options.qs).length ? options.qs : undefined,
				body: options.body,
				json: options.json ?? false,
				skipSslCertificateValidation: credentials.allowUnauthorizedCerts,
			};

			return this.helpers.httpRequestWithAuthentication.call(
				this,
				'fortiSiemApi',
				requestOptions,
			);
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData: IDataObject | IDataObject[];

				// ── INCIDENT ─────────────────────────────────────────────
				if (resource === 'incident') {
					if (operation === 'getMany') {
						const status = this.getNodeParameter('status', i, '') as string;
						const qs: IDataObject = {};
						if (status !== '') qs.status = status;
						responseData = parseResponse(await makeRequest('GET', '/phoenix/rest/pub/incident', { qs }));
					} else if (operation === 'fetch') {
						const filters = this.getNodeParameter('filterOptions', i, {}) as IDataObject;
						const body: IDataObject = {};
						const filterClause: IDataObject = {};

						if (filters.incidentId) {
							filterClause.incidentId = splitList(filters.incidentId as string).map(Number);
						}
						if (filters.status) {
							filterClause.status = splitList(filters.status as string).map(Number);
						}
						if (Object.keys(filterClause).length) body.filters = filterClause;

						if (filters.timeFrom) body.timeFrom = filters.timeFrom;
						if (filters.timeTo) body.timeTo = filters.timeTo;
						if (filters.start !== undefined) body.start = filters.start;
						if (filters.size !== undefined) body.size = filters.size;
						if (filters.orderBy) body.orderBy = filters.orderBy;
						if (filters.descending !== undefined) body.descending = filters.descending;
						if (filters.fields) body.fields = splitList(filters.fields as string);

						responseData = parseResponse(
							await makeRequest('POST', '/phoenix/rest/pub/incident', {
								body,
								contentType: 'application/json',
								json: true,
							}),
						);
					} else if (operation === 'getTriggeringEvents') {
						const incidentId = this.getNodeParameter('incidentId', i) as string;
						const size = this.getNodeParameter('size', i) as number;
						responseData = parseResponse(
							await makeRequest('GET', '/phoenix/rest/pub/incident/triggeringEvents', {
								qs: { incidentId, size },
							}),
						);
					} else if (operation === 'update') {
						const incidentId = this.getNodeParameter('incidentId', i) as string;
						const incidentExtTicketId = this.getNodeParameter('incidentExtTicketId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
						const body: IDataObject = { incidentExtTicketId, ...updateFields };
						responseData = parseResponse(
							await makeRequest(
								'POST',
								`/phoenix/rest/pub/incident/update/${encodeURIComponent(incidentId)}`,
								{ body, contentType: 'application/json', json: true },
							),
						);
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
					}

					// ── EVENT ────────────────────────────────────────────────
				} else if (resource === 'event') {
					if (operation === 'query') {
						const reportXml = this.getNodeParameter('reportXml', i) as string;
						responseData = parseResponse(
							await makeRequest('POST', '/phoenix/rest/query/', {
								body: reportXml,
								contentType: 'text/xml',
							}),
						);
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
					}

					// ── ORGANIZATION ─────────────────────────────────────────
				} else if (resource === 'organization') {
					if (operation === 'getMany') {
						responseData = parseResponse(
							await makeRequest('GET', '/phoenix/rest/config/Domain'),
						);
					} else if (operation === 'add') {
						const body = this.getNodeParameter('body', i) as string;
						responseData = parseResponse(
							await makeRequest('POST', '/phoenix/rest/organization/add', {
								body,
								contentType: 'text/xml',
							}),
						);
					} else if (operation === 'update') {
						responseData = parseResponse(
							await makeRequest('GET', '/phoenix/rest/organization/update'),
						);
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
					}

					// ── WATCHLIST ────────────────────────────────────────────
				} else if (resource === 'watchlist') {
					if (operation === 'getMany') {
						responseData = parseResponse(
							await makeRequest('GET', '/phoenix/rest/watchlist/all'),
						);
					} else if (operation === 'getByEntry') {
						const entryId = this.getNodeParameter('entryId', i) as string;
						responseData = parseResponse(
							await makeRequest(
								'GET',
								`/phoenix/rest/watchlist/byEntry/${encodeURIComponent(entryId)}`,
							),
						);
					} else if (operation === 'addEntry') {
						const watchlistId = this.getNodeParameter('watchlistId', i) as string;
						const body = this.getNodeParameter('body', i) as string;
						responseData = parseResponse(
							await makeRequest('POST', '/phoenix/rest/watchlist/addTo', {
								body,
								qs: { watchlistId },
								contentType: 'application/json',
							}),
						);
					} else if (operation === 'createGroup') {
						const body = this.getNodeParameter('body', i) as string;
						responseData = parseResponse(
							await makeRequest('POST', '/phoenix/rest/watchlist/save', {
								body,
								contentType: 'application/json',
							}),
						);
					} else if (operation === 'deleteEntry') {
						const body = this.getNodeParameter('body', i) as string;
						responseData = parseResponse(
							await makeRequest('POST', '/phoenix/rest/watchlist/entry/delete', {
								body,
								contentType: 'application/json',
							}),
						);
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex: i,
					});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
