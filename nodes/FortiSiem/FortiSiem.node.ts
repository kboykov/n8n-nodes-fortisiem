import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	fortiSiemApiRequest,
	fortiSiemApiRequestFormData,
	splitList,
	splitNumberList,
} from './GenericFunctions';

import { agentFields, agentOperations } from './descriptions/AgentDescription';
import { caseFields, caseOperations } from './descriptions/CaseDescription';
import { cmdbQueryFields, cmdbQueryOperations } from './descriptions/CmdbQueryDescription';
import { contextFields, contextOperations } from './descriptions/ContextDescription';
import { deviceFields, deviceOperations } from './descriptions/DeviceDescription';
import {
	deviceMaintenanceFields,
	deviceMaintenanceOperations,
} from './descriptions/DeviceMaintenanceDescription';
import { discoveryFields, discoveryOperations } from './descriptions/DiscoveryDescription';
import { eventFields, eventOperations } from './descriptions/EventDescription';
import { healthFields, healthOperations } from './descriptions/HealthDescription';
import { incidentFields, incidentOperations } from './descriptions/IncidentDescription';
import { lookupTableFields, lookupTableOperations } from './descriptions/LookupTableDescription';
import {
	organizationFields,
	organizationOperations,
} from './descriptions/OrganizationDescription';
import { osqueryFields, osqueryOperations } from './descriptions/OsqueryDescription';
import { reputationFields, reputationOperations } from './descriptions/ReputationDescription';
import { watchlistFields, watchlistOperations } from './descriptions/WatchlistDescription';
import { workerFields, workerOperations } from './descriptions/WorkerDescription';

// Convert an n8n dateTime value (ISO string) into epoch milliseconds.
function toEpochMs(value: unknown): number | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	const time = new Date(value as string).getTime();
	return Number.isNaN(time) ? undefined : time;
}

// Convert an n8n dateTime value (ISO string) into epoch seconds.
function toEpochSeconds(value: unknown): number | undefined {
	const ms = toEpochMs(value);
	return ms === undefined ? undefined : Math.floor(ms / 1000);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// FortiSIEM async query endpoints return an ID in various shapes; normalize it.
function extractQueryId(response: unknown): string | undefined {
	if (typeof response === 'string') return response.trim() || undefined;
	if (response && typeof response === 'object') {
		const obj = response as IDataObject;
		const candidate = obj.queryId ?? obj.queryID ?? obj.id ?? obj.data;
		if (candidate !== undefined && candidate !== null) return String(candidate);
	}
	return undefined;
}

// Best-effort numeric progress extraction (endpoints return a number or an object).
function extractProgress(response: unknown): number {
	if (typeof response === 'number') return response;
	if (typeof response === 'string') {
		const n = Number(response.trim());
		return Number.isNaN(n) ? 0 : n;
	}
	if (response && typeof response === 'object') {
		const obj = response as IDataObject;
		const raw = obj.progress ?? obj.percent ?? obj.data;
		const n = Number(raw);
		return Number.isNaN(n) ? 0 : n;
	}
	return 0;
}

export class FortiSiem implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FortiSIEM',
		name: 'fortiSiem',
		icon: 'file:../../icons/fortisiem.png',
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
					{ name: 'Agent', value: 'agent', description: 'Windows and Linux agent status' },
					{ name: 'Case', value: 'case', description: 'Case management' },
					{ name: 'CMDB Query', value: 'cmdbQuery', description: 'Query CMDB objects and schema' },
					{ name: 'Context', value: 'context', description: 'Host/IP/user context from CMDB' },
					{ name: 'Device', value: 'device', description: 'CMDB device operations' },
					{
						name: 'Device Maintenance',
						value: 'deviceMaintenance',
						description: 'Device maintenance schedules',
					},
					{ name: 'Discovery', value: 'discovery', description: 'Device discovery and credentials' },
					{ name: 'Event', value: 'event', description: 'Run event queries' },
					{ name: 'Health', value: 'health', description: 'System health of the cluster' },
					{ name: 'Incident', value: 'incident', description: 'Fetch, inspect and update incidents' },
					{ name: 'Lookup Table', value: 'lookupTable', description: 'Manage lookup tables' },
					{ name: 'Organization', value: 'organization', description: 'Manage organizations' },
					{ name: 'Osquery', value: 'osquery', description: 'Run Osquery on agents' },
					{
						name: 'Reputation',
						value: 'reputation',
						description: 'Reputation of IPs, domains, hashes and URLs',
					},
					{ name: 'Watchlist', value: 'watchlist', description: 'Manage watchlists and entries' },
					{ name: 'Worker', value: 'worker', description: 'Event worker information' },
				],
				default: 'incident',
			},

			// Operations
			...agentOperations,
			...caseOperations,
			...cmdbQueryOperations,
			...contextOperations,
			...deviceOperations,
			...deviceMaintenanceOperations,
			...discoveryOperations,
			...eventOperations,
			...healthOperations,
			...incidentOperations,
			...lookupTableOperations,
			...organizationOperations,
			...osqueryOperations,
			...reputationOperations,
			...watchlistOperations,
			...workerOperations,

			// Fields
			...agentFields,
			...caseFields,
			...cmdbQueryFields,
			...contextFields,
			...deviceFields,
			...deviceMaintenanceFields,
			...discoveryFields,
			...eventFields,
			...healthFields,
			...incidentFields,
			...lookupTableFields,
			...organizationFields,
			...osqueryFields,
			...reputationFields,
			...watchlistFields,
			...workerFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData: IDataObject | IDataObject[];

				switch (resource) {
					case 'incident':
						responseData = await handleIncident.call(this, operation, i);
						break;
					case 'event':
						responseData = await handleEvent.call(this, operation, i);
						break;
					case 'case':
						responseData = await handleCase.call(this, operation, i);
						break;
					case 'cmdbQuery':
						responseData = await handleCmdbQuery.call(this, operation, i);
						break;
					case 'device':
						responseData = await handleDevice.call(this, operation, i);
						break;
					case 'deviceMaintenance':
						responseData = await handleDeviceMaintenance.call(this, operation, i);
						break;
					case 'discovery':
						responseData = await handleDiscovery.call(this, operation, i);
						break;
					case 'organization':
						responseData = await handleOrganization.call(this, operation, i);
						break;
					case 'context':
						responseData = await handleContext.call(this, operation, i);
						break;
					case 'reputation':
						responseData = await handleReputation.call(this, operation, i);
						break;
					case 'lookupTable':
						responseData = await handleLookupTable.call(this, operation, i);
						break;
					case 'osquery':
						responseData = await handleOsquery.call(this, operation, i);
						break;
					case 'agent':
						responseData = await handleAgent.call(this, operation, i);
						break;
					case 'health':
						responseData = await handleHealth.call(this, operation, i);
						break;
					case 'watchlist':
						responseData = await handleWatchlist.call(this, operation, i);
						break;
					case 'worker':
						responseData = await handleWorker.call(this, operation, i);
						break;
					default:
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

// ─────────────────────────────────────────────────────────────────────────────
// Resource handlers
// ─────────────────────────────────────────────────────────────────────────────

async function handleIncident(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getMany') {
		const filterBy = this.getNodeParameter('filterBy', i) as string;
		const additional = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
		const qs: IDataObject = {};
		if (filterBy === 'incidentId') {
			qs.incidentId = splitNumberList(this.getNodeParameter('incidentIds', i) as string);
		} else {
			qs.timeFrom = toEpochMs(this.getNodeParameter('timeFrom', i));
			qs.timeTo = toEpochMs(this.getNodeParameter('timeTo', i));
		}
		if (Array.isArray(additional.status) && additional.status.length) qs.status = additional.status;
		if (additional.size) qs.size = additional.size;
		return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/pub/incident', {
			qs,
		})) as IDataObject;
	}

	if (operation === 'fetch') {
		const filters = this.getNodeParameter('filterOptions', i, {}) as IDataObject;
		const body: IDataObject = {};
		const filterClause: IDataObject = {};
		if (filters.incidentId) filterClause.incidentId = splitNumberList(filters.incidentId as string);
		if (Array.isArray(filters.incidentStatus) && filters.incidentStatus.length) {
			filterClause.incidentStatus = filters.incidentStatus;
		}
		if (Array.isArray(filters.eventSeverityCat) && filters.eventSeverityCat.length) {
			filterClause.eventSeverityCat = filters.eventSeverityCat;
		}
		if (filters.customer) filterClause.customer = splitList(filters.customer as string);
		if (Object.keys(filterClause).length) body.filters = filterClause;

		const timeFrom = toEpochMs(filters.timeFrom);
		const timeTo = toEpochMs(filters.timeTo);
		if (timeFrom !== undefined) body.timeFrom = timeFrom;
		if (timeTo !== undefined) body.timeTo = timeTo;
		if (filters.start !== undefined) body.start = filters.start;
		if (filters.size !== undefined) body.size = filters.size;
		if (filters.orderBy) {
			body.orderBy = filters.orderBy;
			if (filters.descending !== undefined) body.descending = filters.descending;
		}
		if (filters.fields) body.fields = splitList(filters.fields as string);

		return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/pub/incident', {
			body,
			contentType: 'application/json',
		})) as IDataObject;
	}

	if (operation === 'getPage') {
		const queryId = this.getNodeParameter('queryId', i) as string;
		const pageNumber = this.getNodeParameter('pageNumber', i) as number;
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			`/phoenix/rest/pub/incident/${encodeURIComponent(queryId)}/${pageNumber}`,
		)) as IDataObject;
	}

	if (operation === 'update') {
		const incidentId = this.getNodeParameter('incidentId', i) as string;
		const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
		const body: IDataObject = { ...updateFields };
		const extCleared = toEpochMs(updateFields.incidentExtClearedTime);
		if (extCleared !== undefined) body.incidentExtClearedTime = extCleared;
		else delete body.incidentExtClearedTime;
		return (await fortiSiemApiRequest.call(
			this,
			'POST',
			`/phoenix/rest/pub/incident/update/${encodeURIComponent(incidentId)}`,
			{ body, contentType: 'application/json' },
		)) as IDataObject;
	}

	if (operation === 'startTriggeringEvents') {
		const qs = triggeringEventsQuery.call(this, i);
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			'/phoenix/rest/pub/incident/triggeringEvents/start',
			{ qs },
		)) as IDataObject;
	}

	if (operation === 'triggeringEventsProgress') {
		const queryId = this.getNodeParameter('queryId', i) as string;
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			`/phoenix/rest/pub/incident/triggeringEvents/progress/${encodeURIComponent(queryId)}`,
		)) as IDataObject;
	}

	if (operation === 'triggeringEventsResult') {
		const queryId = this.getNodeParameter('queryId', i) as string;
		const size = this.getNodeParameter('size', i, 10) as number;
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			`/phoenix/rest/pub/incident/triggeringEvents/result/${encodeURIComponent(queryId)}`,
			{ qs: { size } },
		)) as IDataObject;
	}

	if (operation === 'getTriggeringEvents') {
		const qs = triggeringEventsQuery.call(this, i);
		const size = this.getNodeParameter('size', i, 10) as number;
		const pollInterval = this.getNodeParameter('pollInterval', i, 1000) as number;
		const maxPolls = this.getNodeParameter('maxPolls', i, 30) as number;

		const startResponse = await fortiSiemApiRequest.call(
			this,
			'GET',
			'/phoenix/rest/pub/incident/triggeringEvents/start',
			{ qs },
		);
		const queryId = extractQueryId(startResponse);
		if (!queryId) {
			throw new NodeOperationError(this.getNode(), 'Could not determine triggering events query ID', {
				itemIndex: i,
			});
		}

		for (let attempt = 0; attempt < maxPolls; attempt++) {
			const progress = await fortiSiemApiRequest.call(
				this,
				'GET',
				`/phoenix/rest/pub/incident/triggeringEvents/progress/${encodeURIComponent(queryId)}`,
			);
			if (extractProgress(progress) >= 100) break;
			await sleep(pollInterval);
		}

		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			`/phoenix/rest/pub/incident/triggeringEvents/result/${encodeURIComponent(queryId)}`,
			{ qs: { size } },
		)) as IDataObject;
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

function triggeringEventsQuery(this: IExecuteFunctions, i: number): IDataObject {
	return {
		incidentId: this.getNodeParameter('incidentId', i) as number,
		timeFrom: toEpochMs(this.getNodeParameter('timeFrom', i)),
		timeTo: toEpochMs(this.getNodeParameter('timeTo', i)),
		size: this.getNodeParameter('size', i, 10) as number,
	};
}

async function handleEvent(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'submitQuery' || operation === 'runQuery') {
		const body = this.getNodeParameter('queryJson', i) as IDataObject;
		const submitResponse = await fortiSiemApiRequest.call(
			this,
			'POST',
			'/phoenix/rest/pub/v2/query/eventQuery',
			{ body, contentType: 'application/json' },
		);
		if (operation === 'submitQuery') return submitResponse as IDataObject;

		const queryId = extractQueryId(submitResponse);
		if (!queryId) {
			throw new NodeOperationError(this.getNode(), 'Could not determine event query ID', {
				itemIndex: i,
			});
		}
		const limit = this.getNodeParameter('limit', i, 100) as number;
		const pollInterval = this.getNodeParameter('pollInterval', i, 1500) as number;
		const maxPolls = this.getNodeParameter('maxPolls', i, 40) as number;

		for (let attempt = 0; attempt < maxPolls; attempt++) {
			const progress = await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/pub/v2/query/progress', {
				qs: { queryId },
			});
			if (extractProgress(progress) >= 100) break;
			await sleep(pollInterval);
		}

		return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/pub/v2/query/events/results', {
			qs: { queryId, offset: 0, limit },
		})) as IDataObject;
	}

	if (operation === 'getProgress') {
		const queryId = this.getNodeParameter('queryId', i) as string;
		return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/pub/v2/query/progress', {
			qs: { queryId },
		})) as IDataObject;
	}

	if (operation === 'getResults') {
		const queryId = this.getNodeParameter('queryId', i) as string;
		const offset = this.getNodeParameter('offset', i, 0) as number;
		const limit = this.getNodeParameter('limit', i, 100) as number;
		return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/pub/v2/query/events/results', {
			qs: { queryId, offset, limit },
		})) as IDataObject;
	}

	if (operation === 'submitArchiveQuery') {
		const reportXml = this.getNodeParameter('reportXml', i) as string;
		return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/query/archive', {
			body: reportXml,
			contentType: 'text/xml',
		})) as IDataObject;
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

async function handleCase(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'create') {
		const additional = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
		const body: IDataObject = {
			organization: this.getNodeParameter('organization', i) as string,
			summary: this.getNodeParameter('summary', i) as string,
			assignee: this.getNodeParameter('assignee', i) as string,
			severity: this.getNodeParameter('severity', i) as string,
		};
		if (additional.caseMgmtPolicy) body.caseMgmtPolicy = additional.caseMgmtPolicy;
		if (additional.note) body.note = additional.note;
		if (additional.incidentIds) body.incidentIds = splitNumberList(additional.incidentIds as string);
		const dueDate = toEpochMs(additional.dueDate);
		if (dueDate !== undefined) body.dueDate = dueDate;
		return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/pub/case', {
			body,
			contentType: 'application/json',
		})) as IDataObject;
	}

	if (operation === 'update') {
		const caseId = this.getNodeParameter('caseId', i) as number;
		const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
		const body: IDataObject = { ...updateFields };
		if (updateFields.incidentIds) body.incidentIds = splitNumberList(updateFields.incidentIds as string);
		const dueDate = toEpochMs(updateFields.dueDate);
		if (dueDate !== undefined) body.dueDate = dueDate;
		else delete body.dueDate;
		return (await fortiSiemApiRequest.call(this, 'PUT', `/phoenix/rest/pub/case/${caseId}`, {
			body,
			contentType: 'application/json',
		})) as IDataObject;
	}

	if (operation === 'getAnalysts') {
		const options = this.getNodeParameter('options', i, {}) as IDataObject;
		const qs: IDataObject = {};
		if (options.organization) qs.organization = options.organization;
		const timeFrom = toEpochSeconds(options.timeFrom);
		const timeTo = toEpochSeconds(options.timeTo);
		if (timeFrom !== undefined) qs.timeFrom = timeFrom;
		if (timeTo !== undefined) qs.timeTo = timeTo;
		if (options.start !== undefined) qs.start = options.start;
		if (options.size !== undefined) qs.size = options.size;
		return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/pub/case/analysts', {
			qs,
		})) as IDataObject;
	}

	if (operation === 'addAttachment') {
		const caseId = this.getNodeParameter('caseId', i) as number;
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
		const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
		const formData: IDataObject = {
			file: {
				value: buffer,
				options: {
					filename: binaryData.fileName ?? 'attachment',
					contentType: binaryData.mimeType,
				},
			},
		};
		return (await fortiSiemApiRequestFormData.call(
			this,
			'POST',
			`/phoenix/rest/pub/case/${caseId}/attachment`,
			formData,
		)) as IDataObject;
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

async function handleCmdbQuery(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const target = this.getNodeParameter('target', i) as string;
	if (operation === 'getSchema') {
		return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/query/cmdb/schema', {
			qs: { target },
		})) as IDataObject;
	}
	if (operation === 'query') {
		const size = this.getNodeParameter('size', i, 50) as number;
		const start = this.getNodeParameter('start', i, 0) as number;
		const opts = this.getNodeParameter('queryOptions', i, {}) as IDataObject;
		const body: IDataObject = { target };
		if (opts.condition) body.condition = opts.condition;
		if (opts.selectFields) body.selectFields = splitList(opts.selectFields as string);
		if (opts.orderBy) body.orderBy = splitList(opts.orderBy as string);
		if (opts.runForOrganization) {
			body.runForOrganization = splitList(opts.runForOrganization as string);
		}
		return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/query/cmdb', {
			body,
			qs: { size, start },
			contentType: 'application/json',
		})) as IDataObject;
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

async function handleDevice(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'list') {
		const options = this.getNodeParameter('options', i, {}) as IDataObject;
		const body: IDataObject = {
			start: options.start ?? 0,
			size: options.size ?? 50,
		};
		if (options.custId) body.custId = options.custId;
		const modified = toEpochMs(options.lastModifiedTime);
		if (modified !== undefined) body.lastModifiedTime = modified;
		if (options.includeIps) body.includeIps = options.includeIps;
		if (options.excludeIps) body.excludeIps = options.excludeIps;
		if (options.fields) body.fields = splitList(options.fields as string);
		if (options.filter) {
			const filter =
				typeof options.filter === 'string' ? JSON.parse(options.filter as string) : options.filter;
			if (filter && Object.keys(filter).length) body.filter = filter;
		}
		return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/pub/device', {
			body,
			contentType: 'application/json',
		})) as IDataObject;
	}
	if (operation === 'delete') {
		const body = splitNumberList(this.getNodeParameter('deviceIds', i) as string);
		return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/pub/device/delete', {
			body,
			contentType: 'application/json',
		})) as IDataObject;
	}
	if (operation === 'listMonitored') {
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			'/phoenix/rest/deviceInfo/monitoredDevices',
		)) as IDataObject;
	}
	if (operation === 'updateMonitoring') {
		const body = this.getNodeParameter('monitoringXml', i) as string;
		return (await fortiSiemApiRequest.call(this, 'PUT', '/phoenix/rest/deviceMon/updateMonitor', {
			body,
			contentType: 'application/xml',
		})) as IDataObject;
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

async function handleDeviceMaintenance(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const body = this.getNodeParameter('scheduleXml', i) as string;
	const endpoint =
		operation === 'deleteSchedule'
			? '/phoenix/rest/deviceMaint/delete'
			: '/phoenix/rest/deviceMaint/update';
	return (await fortiSiemApiRequest.call(this, 'PUT', endpoint, {
		body,
		contentType: 'application/xml',
	})) as IDataObject;
}

async function handleDiscovery(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'discover') {
		const body = this.getNodeParameter('discoveryXml', i) as string;
		return (await fortiSiemApiRequest.call(this, 'PUT', '/phoenix/rest/deviceMon/discover', {
			body,
			contentType: 'application/xml',
		})) as IDataObject;
	}
	if (operation === 'getStatus') {
		const taskId = this.getNodeParameter('taskId', i) as number;
		return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/deviceMon/status', {
			qs: { taskId },
		})) as IDataObject;
	}
	if (operation === 'updateCredential') {
		const body = this.getNodeParameter('credentialXml', i) as string;
		return (await fortiSiemApiRequest.call(this, 'PUT', '/phoenix/rest/deviceMon/updateCredential', {
			body,
			contentType: 'application/xml',
		})) as IDataObject;
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

async function handleOrganization(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getMany') {
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			'/phoenix/rest/organization/list',
		)) as IDataObject;
	}
	if (operation === 'delete') {
		const organization = this.getNodeParameter('organizationName', i) as string;
		return (await fortiSiemApiRequest.call(this, 'PUT', '/phoenix/rest/organization/delete', {
			qs: { organization },
		})) as IDataObject;
	}
	if (operation === 'add' || operation === 'update') {
		const body = this.getNodeParameter('organizationXml', i) as string;
		const endpoint =
			operation === 'add' ? '/phoenix/rest/organization/add' : '/phoenix/rest/organization/update';
		return (await fortiSiemApiRequest.call(this, 'PUT', endpoint, {
			body,
			contentType: 'application/xml',
		})) as IDataObject;
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

async function handleContext(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const value = this.getNodeParameter('value', i) as string;
	const map: IDataObject = {
		getByHostname: '/phoenix/rest/context/hostname',
		getByIp: '/phoenix/rest/context/ip',
		getByUser: '/phoenix/rest/context/user',
	};
	const endpoint = map[operation] as string | undefined;
	if (!endpoint) {
		throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
	}
	return (await fortiSiemApiRequest.call(this, 'GET', endpoint, {
		qs: { value },
	})) as IDataObject;
}

async function handleReputation(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const values = splitList(this.getNodeParameter('values', i) as string);
	const config: Record<string, { endpoint: string; key: string }> = {
		checkDomain: { endpoint: '/phoenix/rest/pub/reputation/domain', key: 'ipList' },
		checkHash: { endpoint: '/phoenix/rest/pub/reputation/hash', key: 'hashList' },
		checkIp: { endpoint: '/phoenix/rest/pub/reputation/ip', key: 'ipList' },
		checkUrl: { endpoint: '/phoenix/rest/pub/reputation/url', key: 'urlList' },
	};
	const cfg = config[operation];
	if (!cfg) {
		throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
	}
	return (await fortiSiemApiRequest.call(this, 'POST', cfg.endpoint, {
		body: { [cfg.key]: values },
		contentType: 'application/json',
	})) as IDataObject;
}

async function handleLookupTable(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'list') {
		const options = this.getNodeParameter('options', i, {}) as IDataObject;
		const qs: IDataObject = {};
		if (options.status !== undefined) qs.status = options.status;
		if (options.size !== undefined) qs.size = options.size;
		return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/pub/lookupTable', {
			qs,
		})) as IDataObject;
	}
	if (operation === 'create') {
		const body = this.getNodeParameter('bodyJson', i) as IDataObject;
		return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/pub/lookupTable', {
			body,
			contentType: 'application/json',
		})) as IDataObject;
	}

	const lookupTableId = this.getNodeParameter('lookupTableId', i) as number;

	if (operation === 'delete') {
		return (await fortiSiemApiRequest.call(
			this,
			'DELETE',
			`/phoenix/rest/pub/lookupTable/${lookupTableId}`,
		)) as IDataObject;
	}
	if (operation === 'getData') {
		const options = this.getNodeParameter('options', i, {}) as IDataObject;
		const qs: IDataObject = {};
		if (options.start !== undefined) qs.start = options.start;
		if (options.size !== undefined) qs.size = options.size;
		if (options.searchText) qs.searchText = options.searchText;
		if (options.sortBy) qs.sortBy = options.sortBy;
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			`/phoenix/rest/pub/lookupTable/${lookupTableId}/data`,
			{ qs },
		)) as IDataObject;
	}
	if (operation === 'updateData') {
		const key = this.getNodeParameter('key', i) as string;
		const body = this.getNodeParameter('bodyJson', i) as IDataObject;
		return (await fortiSiemApiRequest.call(
			this,
			'PUT',
			`/phoenix/rest/pub/lookupTable/${lookupTableId}/data`,
			{ body, headers: { key }, contentType: 'application/json' },
		)) as IDataObject;
	}
	if (operation === 'deleteData') {
		const body = this.getNodeParameter('bodyJson', i) as IDataObject[];
		return (await fortiSiemApiRequest.call(
			this,
			'PUT',
			`/phoenix/rest/pub/lookupTable/${lookupTableId}/data/delete`,
			{ body, contentType: 'application/json' },
		)) as IDataObject;
	}
	if (operation === 'import') {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
		const mapping = this.getNodeParameter('mapping', i) as string;
		const importOptions = this.getNodeParameter('importOptions', i, {}) as IDataObject;
		const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
		const formData: IDataObject = {
			file: {
				value: buffer,
				options: {
					filename: binaryData.fileName ?? 'import.csv',
					contentType: binaryData.mimeType ?? 'text/csv',
				},
			},
			mapping,
		};
		if (importOptions.fileSeparator) formData.fileSeparator = importOptions.fileSeparator;
		if (importOptions.fileQuoteChar) formData.fileQuoteChar = importOptions.fileQuoteChar;
		if (importOptions.skipHeader !== undefined) {
			formData.skipHeader = String(importOptions.skipHeader);
		}
		if (importOptions.updateType) formData.updateType = importOptions.updateType;
		return (await fortiSiemApiRequestFormData.call(
			this,
			'POST',
			`/phoenix/rest/pub/lookupTable/${lookupTableId}/import`,
			formData,
		)) as IDataObject;
	}
	if (operation === 'getImportStatus') {
		const taskId = this.getNodeParameter('taskId', i) as number;
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			`/phoenix/rest/pub/lookupTable/${lookupTableId}/task/${taskId}`,
		)) as IDataObject;
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

async function handleOsquery(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'run') {
		const body: IDataObject = { query: this.getNodeParameter('query', i) as string };
		const agentIds = splitNumberList(this.getNodeParameter('agentIds', i, '') as string);
		const hostNames = splitList(this.getNodeParameter('hostNames', i, '') as string);
		if (agentIds.length) body.agentIds = agentIds;
		if (hostNames.length) body.hostNames = hostNames;
		return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/pub/osquery/run', {
			body,
			contentType: 'application/json',
		})) as IDataObject;
	}
	if (operation === 'getProgress' || operation === 'getResult') {
		const taskIds = splitNumberList(this.getNodeParameter('taskIds', i) as string);
		const endpoint =
			operation === 'getProgress'
				? '/phoenix/rest/pub/osquery/progress'
				: '/phoenix/rest/pub/osquery/result';
		return (await fortiSiemApiRequest.call(this, 'POST', endpoint, {
			body: { taskIds },
			contentType: 'application/json',
		})) as IDataObject;
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

async function handleAgent(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getStatus') {
		const options = this.getNodeParameter('options', i, {}) as IDataObject;
		const qs: IDataObject = {};
		if (options.start !== undefined) qs.start = options.start;
		if (options.size !== undefined) qs.size = options.size;
		const body = options.orgName ? [{ orgName: options.orgName }] : undefined;
		return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/agentStatus/v3/all', {
			qs,
			body,
			contentType: body ? 'application/json' : undefined,
		})) as IDataObject;
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

async function handleHealth(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getFull') {
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			'/phoenix/rest/system/health',
		)) as IDataObject;
	}
	if (operation === 'getSummary') {
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			'/phoenix/rest/system/health/summary',
		)) as IDataObject;
	}
	if (operation === 'getInstance') {
		const instanceId = this.getNodeParameter('instanceId', i) as number;
		return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/system/health/instance', {
			qs: { instanceId },
		})) as IDataObject;
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}

async function handleWatchlist(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	switch (operation) {
		case 'getMany':
			return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/watchlist/all')) as IDataObject;
		case 'getSummary': {
			const options = this.getNodeParameter('options', i, {}) as IDataObject;
			const qs: IDataObject = {};
			if (options.custId) qs.custId = options.custId;
			if (options.id) qs.id = options.id;
			return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/watchlist/all/summary', {
				qs,
			})) as IDataObject;
		}
		case 'get': {
			const watchlistId = this.getNodeParameter('watchlistId', i) as string;
			return (await fortiSiemApiRequest.call(
				this,
				'GET',
				`/phoenix/rest/watchlist/${encodeURIComponent(watchlistId)}`,
			)) as IDataObject;
		}
		case 'getEntry': {
			const entryId = this.getNodeParameter('watchlistEntryId', i) as string;
			return (await fortiSiemApiRequest.call(
				this,
				'GET',
				`/phoenix/rest/watchlist/entry/${encodeURIComponent(entryId)}`,
			)) as IDataObject;
		}
		case 'getContainingWatchlist': {
			const entryId = this.getNodeParameter('watchlistEntryId', i) as string;
			return (await fortiSiemApiRequest.call(
				this,
				'GET',
				`/phoenix/rest/watchlist/byEntry/${encodeURIComponent(entryId)}`,
			)) as IDataObject;
		}
		case 'getByValue': {
			const qs: IDataObject = { entryValue: this.getNodeParameter('entryValue', i) as string };
			const custId = this.getNodeParameter('custId', i, '') as string;
			if (custId) qs.custId = custId;
			return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/watchlist/value', {
				qs,
			})) as IDataObject;
		}
		case 'getCount': {
			const groupId = this.getNodeParameter('groupId', i, 0) as number;
			const qs: IDataObject = {};
			if (groupId) qs.groupId = groupId;
			return (await fortiSiemApiRequest.call(this, 'GET', '/phoenix/rest/watchlist/cnt', {
				qs,
			})) as IDataObject;
		}
		case 'getEntriesByType': {
			const entryType = this.getNodeParameter('entryType', i) as string;
			const name = this.getNodeParameter('name', i) as string;
			return (await fortiSiemApiRequest.call(this, 'GET', `/phoenix/rest/watchlist/${entryType}`, {
				qs: { name },
			})) as IDataObject;
		}
		case 'create': {
			const body = this.getNodeParameter('bodyJson', i) as IDataObject[];
			return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/watchlist/save', {
				body,
				contentType: 'application/json',
			})) as IDataObject;
		}
		case 'addEntries': {
			const watchlistId = this.getNodeParameter('watchlistIdQuery', i) as string;
			const body = this.getNodeParameter('entriesJson', i) as IDataObject[];
			return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/watchlist/addTo', {
				body,
				qs: { watchlistId },
				contentType: 'application/json',
			})) as IDataObject;
		}
		case 'deleteWatchlists': {
			const body = splitNumberList(this.getNodeParameter('ids', i) as string);
			return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/watchlist/delete', {
				body,
				contentType: 'application/json',
			})) as IDataObject;
		}
		case 'deleteEntries': {
			const body = splitNumberList(this.getNodeParameter('ids', i) as string);
			return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/watchlist/entry/delete', {
				body,
				contentType: 'application/json',
			})) as IDataObject;
		}
		case 'updateEntry': {
			const body: IDataObject = {
				id: this.getNodeParameter('entryId', i) as number,
				entryValue: this.getNodeParameter('entryValue', i) as string,
			};
			return (await fortiSiemApiRequest.call(this, 'POST', '/phoenix/rest/watchlist/entry/save', {
				body,
				contentType: 'application/json',
			})) as IDataObject;
		}
		case 'setEntryActive': {
			const entryId = this.getNodeParameter('watchlistEntryId', i) as string;
			const state = this.getNodeParameter('state', i) as string;
			return (await fortiSiemApiRequest.call(
				this,
				'POST',
				`/phoenix/rest/watchlist/entry/active/${encodeURIComponent(entryId)}`,
				{ qs: { state } },
			)) as IDataObject;
		}
		case 'setEntryCount': {
			const entryId = this.getNodeParameter('watchlistEntryId', i) as string;
			const count = this.getNodeParameter('count', i) as number;
			return (await fortiSiemApiRequest.call(
				this,
				'POST',
				`/phoenix/rest/watchlist/entry/count/${encodeURIComponent(entryId)}`,
				{ qs: { count } },
			)) as IDataObject;
		}
		case 'setEntryLastSeen': {
			const entryId = this.getNodeParameter('watchlistEntryId', i) as string;
			const custId = this.getNodeParameter('custId', i) as string;
			const lastSeenTime = toEpochMs(this.getNodeParameter('lastSeenTime', i));
			return (await fortiSiemApiRequest.call(
				this,
				'POST',
				`/phoenix/rest/watchlist/entry/lastseen/${encodeURIComponent(entryId)}`,
				{ qs: { custId, lastSeenTime } },
			)) as IDataObject;
		}
		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
				itemIndex: i,
			});
	}
}

async function handleWorker(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getEventWorkers') {
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			'/phoenix/rest/system/eventworker',
		)) as IDataObject;
	}
	if (operation === 'getQueueState') {
		return (await fortiSiemApiRequest.call(
			this,
			'GET',
			'/workerUploadHealth/response.json',
		)) as IDataObject;
	}
	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
}
