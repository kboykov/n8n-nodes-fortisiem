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
				name: 'Fetch (Advanced)',
				value: 'fetch',
				description: 'Query incidents with custom filters, fields, paging and ordering',
				action: 'Fetch incidents with filters',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get incidents by time window or incident ID list (default fields)',
				action: 'Get many incidents',
			},
			{
				name: 'Get Page',
				value: 'getPage',
				description: 'Get the next page of a previous incident query using its query ID',
				action: 'Get a page of incidents',
			},
			{
				name: 'Get Triggering Events',
				value: 'getTriggeringEvents',
				description:
					'Start, poll and retrieve the raw events that triggered an incident (runs all three steps)',
				action: 'Get triggering events of an incident',
			},
			{
				name: 'Get Triggering Events Progress',
				value: 'triggeringEventsProgress',
				description: 'Get the progress (percentage) of a triggering-events query',
				action: 'Get triggering events progress',
			},
			{
				name: 'Get Triggering Events Result',
				value: 'triggeringEventsResult',
				description: 'Get the results of a completed triggering-events query',
				action: 'Get triggering events result',
			},
			{
				name: 'Start Triggering Events Query',
				value: 'startTriggeringEvents',
				description: 'Initiate a triggering-events query and return its query ID',
				action: 'Start a triggering events query',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update attributes of a single incident',
				action: 'Update an incident',
			},
		],
		default: 'getMany',
	},
];

const statusOptions = [
	{ name: 'Active', value: 0 },
	{ name: 'Automatically Cleared', value: 1 },
	{ name: 'Manually Cleared', value: 2 },
	{ name: 'System Cleared', value: 3 },
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
		displayName: 'Filter By',
		name: 'filterBy',
		type: 'options',
		default: 'timeRange',
		description: 'Query incidents either by a time window or by an explicit list of incident IDs',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getMany'],
			},
		},
		options: [
			{ name: 'Time Range', value: 'timeRange' },
			{ name: 'Incident IDs', value: 'incidentId' },
		],
	},
	{
		displayName: 'Time From',
		name: 'timeFrom',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'Start of the time range (converted to epoch milliseconds)',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getMany'],
				filterBy: ['timeRange'],
			},
		},
	},
	{
		displayName: 'Time To',
		name: 'timeTo',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'End of the time range (converted to epoch milliseconds)',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getMany'],
				filterBy: ['timeRange'],
			},
		},
	},
	{
		displayName: 'Incident IDs',
		name: 'incidentIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: '114780,114781',
		description: 'Comma-separated list of incident IDs to fetch',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getMany'],
				filterBy: ['incidentId'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				description: 'Filter by one or more incident status values',
				options: statusOptions,
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				default: 500,
				description: 'Number of incidents to return per page (default 500)',
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
		description: 'Filters, paging and ordering used to build the request body',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['fetch'],
			},
		},
		options: [
			{
				displayName: 'Customer Names',
				name: 'customer',
				type: 'string',
				default: '',
				placeholder: 'Super,org2',
				description: 'Comma-separated list of customer/organization names to filter by',
			},
			{
				displayName: 'Descending',
				name: 'descending',
				type: 'boolean',
				default: true,
				description: 'Whether to sort in descending order (only applied when Order By is set)',
			},
			{
				displayName: 'Event Severity Category',
				name: 'eventSeverityCat',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Low', value: 'LOW' },
					{ name: 'Medium', value: 'MEDIUM' },
					{ name: 'High', value: 'HIGH' },
				],
				description: 'Filter by event severity category',
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'string',
				default: DEFAULT_FETCH_FIELDS,
				description: 'Comma-separated list of incident fields to return',
			},
			{
				displayName: 'Incident IDs',
				name: 'incidentId',
				type: 'string',
				default: '',
				placeholder: '114780,114781',
				description: 'Comma-separated list of incident IDs. If set, a time range is not required.',
			},
			{
				displayName: 'Incident Status',
				name: 'incidentStatus',
				type: 'multiOptions',
				default: [],
				options: statusOptions,
				description: 'Filter by incident status',
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'string',
				default: 'incidentLastSeen',
				description: 'Datetime attribute to order by, e.g. incidentLastSeen',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				default: 500,
				description: 'Number of incidents to return per page',
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'number',
				default: 0,
				description: 'Offset of the first incident to return (for paging)',
			},
			{
				displayName: 'Time From',
				name: 'timeFrom',
				type: 'dateTime',
				default: '',
				description: 'Start of the time range. Required if no incident IDs are specified.',
			},
			{
				displayName: 'Time To',
				name: 'timeTo',
				type: 'dateTime',
				default: '',
				description: 'End of the time range. Required if no incident IDs are specified.',
			},
		],
	},

	// -------------------------------------------
	// incident: getPage
	// -------------------------------------------
	{
		displayName: 'Query ID',
		name: 'queryId',
		type: 'string',
		default: '',
		required: true,
		description: 'The queryId returned by the first Get Many / Fetch call',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getPage'],
			},
		},
	},
	{
		displayName: 'Page Number',
		name: 'pageNumber',
		type: 'number',
		default: 2,
		required: true,
		description: 'Page to retrieve. Page 1 is the first call, so this should start at 2.',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getPage'],
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
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description: 'Only the attributes you set are updated',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Comments',
				name: 'comments',
				type: 'string',
				typeOptions: { rows: 2 },
				default: '',
				description: 'Investigation notes to add to this incident',
			},
			{
				displayName: 'External Cleared Time',
				name: 'incidentExtClearedTime',
				type: 'dateTime',
				default: '',
				description: 'Cleared time as defined in the external ticketing system',
			},
			{
				displayName: 'External Ticket ID',
				name: 'incidentExtTicketId',
				type: 'string',
				default: '',
				description: 'The ticket ID as defined in the external system',
			},
			{
				displayName: 'External Ticket State',
				name: 'incidentExtTicketState',
				type: 'string',
				default: '',
				placeholder: 'CLOSED',
				description: 'The state of the ticket in the external system',
			},
			{
				displayName: 'External Ticket Type',
				name: 'incidentExtTicketType',
				type: 'string',
				default: '',
				placeholder: 'Incident',
				description: 'The external ticket system ticket type',
			},
			{
				displayName: 'External User',
				name: 'incidentExtUser',
				type: 'string',
				default: '',
				description: 'The user as defined in the external ticketing system',
			},
			{
				displayName: 'Incident Severity',
				name: 'incidentSeverity',
				type: 'options',
				default: 'MEDIUM',
				options: [
					{ name: 'Low', value: 'LOW' },
					{ name: 'Medium', value: 'MEDIUM' },
					{ name: 'High', value: 'HIGH' },
				],
			},
			{
				displayName: 'Incident Status',
				name: 'incidentStatus',
				type: 'options',
				default: 2,
				options: statusOptions,
			},
		],
	},

	// -------------------------------------------
	// incident: triggering events (shared incidentId + time window)
	// -------------------------------------------
	{
		displayName: 'Incident ID',
		name: 'incidentId',
		type: 'number',
		default: 0,
		required: true,
		description: 'The incident ID for which to retrieve triggering events',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getTriggeringEvents', 'startTriggeringEvents'],
			},
		},
	},
	{
		displayName: 'Time From',
		name: 'timeFrom',
		type: 'dateTime',
		default: '',
		required: true,
		description:
			'Start of the search window. The interval between Time From and Time To cannot exceed 24 hours.',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getTriggeringEvents', 'startTriggeringEvents'],
			},
		},
	},
	{
		displayName: 'Time To',
		name: 'timeTo',
		type: 'dateTime',
		default: '',
		required: true,
		description:
			'End of the search window. The interval between Time From and Time To cannot exceed 24 hours.',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getTriggeringEvents', 'startTriggeringEvents'],
			},
		},
	},
	{
		displayName: 'Size',
		name: 'size',
		type: 'number',
		default: 10,
		description: 'Number of raw events to return (default 10, max 100)',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getTriggeringEvents', 'startTriggeringEvents', 'triggeringEventsResult'],
			},
		},
	},
	{
		displayName: 'Query ID',
		name: 'queryId',
		type: 'string',
		default: '',
		required: true,
		description: 'The query ID returned by Start Triggering Events Query',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['triggeringEventsProgress', 'triggeringEventsResult'],
			},
		},
	},
	{
		displayName: 'Poll Interval (Ms)',
		name: 'pollInterval',
		type: 'number',
		default: 1000,
		description: 'How long to wait between progress checks while the query completes',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getTriggeringEvents'],
			},
		},
	},
	{
		displayName: 'Max Poll Attempts',
		name: 'maxPolls',
		type: 'number',
		default: 30,
		description: 'Maximum number of progress checks before giving up',
		displayOptions: {
			show: {
				resource: ['incident'],
				operation: ['getTriggeringEvents'],
			},
		},
	},
];
