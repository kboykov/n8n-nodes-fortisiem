import type { INodeProperties } from 'n8n-workflow';

export const eventOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['event'],
			},
		},
		options: [
			{
				name: 'Submit Query',
				value: 'submitQuery',
				description: 'Submit a v2 JSON event query (simple search or advanced ClickHouse SQL)',
				action: 'Submit an event query',
			},
			{
				name: 'Get Query Progress',
				value: 'getProgress',
				description: 'Poll the execution status of a submitted event query',
				action: 'Get event query progress',
			},
			{
				name: 'Get Query Results',
				value: 'getResults',
				description: 'Retrieve paginated result rows of a completed event query',
				action: 'Get event query results',
			},
			{
				name: 'Run Query',
				value: 'runQuery',
				description: 'Submit a query, wait for it to finish and return the results (runs all steps)',
				action: 'Run an event query',
			},
			{
				name: 'Submit Archive Query',
				value: 'submitArchiveQuery',
				description: 'Submit an event query (report XML) against the archive event database',
				action: 'Submit an archive event query',
			},
		],
		default: 'runQuery',
	},
];

const SAMPLE_QUERY = JSON.stringify(
	{
		select: 'srcIpAddr,destIpAddr,COUNT(*) "count"',
		where:
			'eventType IN (Group@PH_SYS_EVENT_PermitNetTraffic,Group@PH_SYS_EVENT_BiNetflowTraffic)',
		groupBy: 'srcIpAddr,destIpAddr',
		having: '',
		orderBy: 'COUNT(*) DESC',
		timeRange: { from: 1775579461, to: 1775665861 },
	},
	null,
	2,
);

const SAMPLE_ARCHIVE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Reports>
  <Report>
    <Name>Firewall Permit Top Ports</Name>
    <SelectClause>
      <AttrList>destIpPort,COUNT(*)</AttrList>
    </SelectClause>
    <PatternClause window="3600">
      <SubPattern name="Filter">
        <SingleEvtConstr>eventType = "PH_SYS_EVENT_PermitNetTraffic"</SingleEvtConstr>
        <GroupByAttr>destIpPort</GroupByAttr>
      </SubPattern>
    </PatternClause>
  </Report>
</Reports>`;

export const eventFields: INodeProperties[] = [
	// -------------------------------------------
	// event: submitQuery / runQuery
	// -------------------------------------------
	{
		displayName: 'Query (JSON)',
		name: 'queryJson',
		type: 'json',
		default: SAMPLE_QUERY,
		required: true,
		description:
			'The v2 event query body. Use select/where/groupBy/having/orderBy + timeRange for a simple search, or an "advanced" object with a ClickHouse SQL string (Super/Global users only).',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['submitQuery', 'runQuery'],
			},
		},
	},

	// -------------------------------------------
	// event: getProgress / getResults
	// -------------------------------------------
	{
		displayName: 'Query ID',
		name: 'queryId',
		type: 'string',
		default: '',
		required: true,
		description: 'The query ID returned by Submit Query',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getProgress', 'getResults'],
			},
		},
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		default: 0,
		description: 'Zero-based starting row offset',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getResults'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 100,
		description: 'Maximum number of rows to return',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getResults'],
			},
		},
	},

	// -------------------------------------------
	// event: runQuery polling
	// -------------------------------------------
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 100,
		description: 'Maximum number of result rows to return',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['runQuery'],
			},
		},
	},
	{
		displayName: 'Poll Interval (Ms)',
		name: 'pollInterval',
		type: 'number',
		default: 1500,
		description: 'How long to wait between progress checks while the query completes',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['runQuery'],
			},
		},
	},
	{
		displayName: 'Max Poll Attempts',
		name: 'maxPolls',
		type: 'number',
		default: 40,
		description: 'Maximum number of progress checks before giving up',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['runQuery'],
			},
		},
	},

	// -------------------------------------------
	// event: submitArchiveQuery
	// -------------------------------------------
	{
		displayName: 'Report XML',
		name: 'reportXml',
		type: 'string',
		typeOptions: { rows: 12 },
		default: SAMPLE_ARCHIVE_XML,
		required: true,
		description:
			'The report definition as XML. Archive queries use the same progress/results endpoints as online queries.',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['submitArchiveQuery'],
			},
		},
	},
];
