import type { INodeProperties } from 'n8n-workflow';

export const cmdbQueryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['cmdbQuery'],
			},
		},
		options: [
			{
				name: 'Query',
				value: 'query',
				description: 'Query CMDB objects (Device, User, Rule, Report, Case, Risk, etc.)',
				action: 'Query CMDB objects',
			},
			{
				name: 'Get Schema',
				value: 'getSchema',
				description: 'Get the schema (fields) of a CMDB table, required to build a query',
				action: 'Get CMDB schema',
			},
		],
		default: 'query',
	},
];

const targetOptions = [
	{ name: 'Audit', value: 'AUDIT' },
	{ name: 'Case', value: 'CASE' },
	{ name: 'Device', value: 'DEVICE' },
	{ name: 'Event Pulling', value: 'EVENT_PULLING' },
	{ name: 'Identity', value: 'IDENTITY' },
	{ name: 'Incident', value: 'INCIDENT' },
	{ name: 'Monitor', value: 'MONITOR' },
	{ name: 'Report', value: 'REPORT' },
	{ name: 'Risk', value: 'RISK' },
	{ name: 'Rule', value: 'RULE' },
	{ name: 'Task', value: 'TASK' },
	{ name: 'User', value: 'USER' },
];

export const cmdbQueryFields: INodeProperties[] = [
	{
		displayName: 'Target',
		name: 'target',
		type: 'options',
		default: 'DEVICE',
		required: true,
		description: 'The CMDB table to query. Table names are case-sensitive.',
		options: targetOptions,
		displayOptions: {
			show: {
				resource: ['cmdbQuery'],
				operation: ['query', 'getSchema'],
			},
		},
	},
	{
		displayName: 'Size',
		name: 'size',
		type: 'number',
		default: 50,
		description: 'Number of results per page (default 50)',
		displayOptions: {
			show: {
				resource: ['cmdbQuery'],
				operation: ['query'],
			},
		},
	},
	{
		displayName: 'Start',
		name: 'start',
		type: 'number',
		default: 0,
		description: 'Result offset (for paging)',
		displayOptions: {
			show: {
				resource: ['cmdbQuery'],
				operation: ['query'],
			},
		},
	},
	{
		displayName: 'Query Options',
		name: 'queryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['cmdbQuery'],
				operation: ['query'],
			},
		},
		options: [
			{
				displayName: 'Condition (SQL WHERE)',
				name: 'condition',
				type: 'string',
				typeOptions: { rows: 2 },
				default: '',
				description: 'SQL WHERE clause used to filter data',
				placeholder: 'Device_Name is not null',
			},
			{
				displayName: 'Select Fields',
				name: 'selectFields',
				type: 'string',
				default: '',
				placeholder: 'Device_Name,Discover_Status,count',
				description: 'Comma-separated list of fields to select',
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'string',
				default: '',
				placeholder: 'count DESC,Device_Name ASC',
				description: 'Comma-separated SQL ORDER BY clauses',
			},
			{
				displayName: 'Run For Organizations',
				name: 'runForOrganization',
				type: 'string',
				default: '',
				placeholder: 'Super,org2',
				description: 'Comma-separated list of organizations to run the query for',
			},
		],
	},
];
