import type { INodeProperties } from 'n8n-workflow';

export const incidentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['incident'],
			},
		},
		options: [
			{
				name: 'Fetch',
				value: 'fetch',
				description: 'Fetch incidents using filters, time range and paging',
				action: 'Fetch incidents',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Retrieve incidents, optionally filtered by status',
				action: 'Get many incidents',
			},
			{
				name: 'Get Triggering Events',
				value: 'getTriggeringEvents',
				description: 'Retrieve the events that triggered an incident',
				action: 'Get triggering events of an incident',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update the external ticket state of an incident',
				action: 'Update an incident',
			},
		],
		default: 'fetch',
	},
];

const DEFAULT_FETCH_FIELDS = [
	'incidentId',
	'incidentTitle',
	'eventName',
	'eventType',
	'eventSeverity',
	'eventSeverityCat',
	'incidentStatus',
	'incidentReso',
	'incidentFirstSeen',
	'incidentLastSeen',
	'incidentSrc',
	'incidentTarget',
	'incidentDetail',
	'incidentRptIp',
	'incidentRptDevName',
	'count',
	'customer',
	'phIncidentCategory',
	'attackTactic',
	'attackTechnique',
].join(',');

export const incidentFields: INodeProperties[] = [
	// -------------------------------------------
	// incident: getMany
	// -------------------------------------------
	{
		displayName: 'Status',
		name: 'status',
		type: 'string',
		default: '',
		placeholder: '0',
		description:
			'Filter incidents by status code (e.g. 0 = Active, 1 = Cleared). Leave empty to return all incidents.',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getMany'],
			},
		},
	},

	// -------------------------------------------
	// incident: getTriggeringEvents
	// -------------------------------------------
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the incident whose triggering events should be retrieved',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getTriggeringEvents'],
			},
		},
	},
	{
		displayName: 'Size',
		name: 'size',
		type: 'number',
		default: 50,
		required: true,
		description: 'Maximum number of triggering events to return',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getTriggeringEvents'],
			},
		},
	},

	// -------------------------------------------
	// incident: update
	// -------------------------------------------
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the incident to update',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'External Ticket ID',
		name: 'incidentExtTicketId',
		type: 'string',
		default: '',
		required: true,
		description: 'The external ticket ID to associate with the incident',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'External User',
				name: 'incidentExtUser',
				type: 'string',
				default: '',
				description: 'Name of the external user handling the ticket',
			},
			{
				displayName: 'External Cleared Time',
				name: 'incidentExtClearedTime',
				type: 'number',
				default: 0,
				description: 'Timestamp (epoch milliseconds) when the external ticket was cleared',
			},
			{
				displayName: 'External Ticket State',
				name: 'incidentExtTicketState',
				type: 'string',
				default: '',
				placeholder: 'Closed',
				description: 'State of the external ticket',
			},
			{
				displayName: 'External Ticket Type',
				name: 'incidentExtTicketType',
				type: 'string',
				default: '',
				description: 'Type of the external ticket',
			},
		],
	},

	// -------------------------------------------
	// incident: fetch
	// -------------------------------------------
	{
		displayName: 'Filter Options',
		name: 'filterOptions',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		description: 'Filters, paging and ordering used to build the fetch request body',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['fetch'],
			},
		},
		options: [
			{
				displayName: 'Incident IDs',
				name: 'incidentId',
				type: 'string',
				default: '',
				placeholder: '8064,8065',
				description: 'Comma-separated list of incident IDs to fetch',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'string',
				default: '',
				placeholder: '0,1',
				description: 'Comma-separated list of status codes to filter by',
			},
			{
				displayName: 'Time From',
				name: 'timeFrom',
				type: 'number',
				default: 0,
				description:
					'Start of the time range as epoch milliseconds. Required if no incident IDs are specified.',
			},
			{
				displayName: 'Time To',
				name: 'timeTo',
				type: 'number',
				default: 0,
				description:
					'End of the time range as epoch milliseconds. Required if no incident IDs are specified.',
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'number',
				default: 0,
				description: 'Offset of the first incident to return (for paging)',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				default: 500,
				description: 'Maximum number of incidents to return per request',
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'string',
				default: 'incidentLastSeen',
				description: 'Field to order results by. Must be one of the requested fields.',
			},
			{
				displayName: 'Descending',
				name: 'descending',
				type: 'boolean',
				default: true,
				description: 'Whether to sort results in descending order',
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'string',
				default: DEFAULT_FETCH_FIELDS,
				description: 'Comma-separated list of incident fields to include in the response',
			},
		],
	},
];
