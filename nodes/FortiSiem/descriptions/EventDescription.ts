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
				name: 'Query',
				value: 'query',
				description: 'Run an event query defined by an XML report and return the query results',
				action: 'Query events',
			},
		],
		default: 'query',
	},
];

const SAMPLE_REPORT = `<?xml version="1.0" encoding="UTF-8"?>
<Reports>
    <Report baseline="" rsSync="">
        <Name>Top FortiSIEM Events By Count</Name>
        <Description>Ranks the events by the number of times they have occurred in a given time period.</Description>
        <CustomerScope groupByEachCustomer="false"></CustomerScope>
        <SelectClause>
            <AttrList>eventType,COUNT(*)</AttrList>
        </SelectClause>
        <OrderByClause>
            <AttrList>COUNT(*) DESC</AttrList>
        </OrderByClause>
        <PatternClause window="3600">
            <SubPattern id="1164394" name="Filter_OVERALL_STATUS">
                <SingleEvtConstr>phCustId = 2001</SingleEvtConstr>
                <GroupByAttr>eventType</GroupByAttr>
            </SubPattern>
        </PatternClause>
        <userRoles>
            <roles custId="2001">1169250</roles>
        </userRoles>
    </Report>
</Reports>`;

export const eventFields: INodeProperties[] = [
	{
		displayName: 'Report XML',
		name: 'reportXml',
		type: 'string',
		typeOptions: {
			rows: 12,
		},
		default: SAMPLE_REPORT,
		required: true,
		description:
			'The report definition as XML. This describes the select, order-by and pattern clauses of the event query.',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['query'],
			},
		},
	},
];
