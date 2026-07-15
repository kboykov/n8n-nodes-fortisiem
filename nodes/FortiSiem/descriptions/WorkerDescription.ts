import type { INodeProperties } from 'n8n-workflow';

export const workerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['worker'],
			},
		},
		options: [
			{
				name: 'Get Event Workers',
				value: 'getEventWorkers',
				description: 'Retrieve the list of event workers defined in FortiSIEM',
				action: 'Get event workers',
			},
			{
				name: 'Get Queue State',
				value: 'getQueueState',
				description: 'Query the worker event upload queue state',
				action: 'Get worker queue state',
			},
		],
		default: 'getEventWorkers',
	},
];

export const workerFields: INodeProperties[] = [];
