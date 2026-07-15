import type { INodeProperties } from 'n8n-workflow';

export const healthOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['health'],
			},
		},
		options: [
			{
				name: 'Get Full Health',
				value: 'getFull',
				description: 'Get complete detailed health of the Manager and every instance',
				action: 'Get full health',
			},
			{
				name: 'Get Instance Health',
				value: 'getInstance',
				description: 'Get detailed health of a single FortiSIEM instance',
				action: 'Get instance health',
			},
			{
				name: 'Get Health Summary',
				value: 'getSummary',
				description: 'Get a health summary of the Manager and every instance',
				action: 'Get health summary',
			},
		],
		default: 'getSummary',
	},
];

export const healthFields: INodeProperties[] = [
	{
		displayName: 'Instance ID',
		name: 'instanceId',
		type: 'number',
		default: 0,
		required: true,
		description: 'Instance ID (obtain it from Get Health Summary)',
		displayOptions: {
			show: {
				resource: ['health'],
				operation: ['getInstance'],
			},
		},
	},
];
