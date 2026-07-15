import type { INodeProperties } from 'n8n-workflow';

export const agentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['agent'],
			},
		},
		options: [
			{
				name: 'Get Status',
				value: 'getStatus',
				description: 'Get the status of Windows and Linux agents (v3)',
				action: 'Get agent status',
			},
		],
		default: 'getStatus',
	},
];

export const agentFields: INodeProperties[] = [
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['agent'],
				operation: ['getStatus'],
			},
		},
		options: [
			{
				displayName: 'Start',
				name: 'start',
				type: 'number',
				default: 0,
				description: 'Pagination offset (0 to count-1)',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				default: 2000,
				description: 'Page size, between 1 and 2000 (default 2000)',
			},
			{
				displayName: 'Organization Name',
				name: 'orgName',
				type: 'string',
				default: '',
				placeholder: 'super',
				description: 'Filter to a single organization by name',
			},
		],
	},
];
