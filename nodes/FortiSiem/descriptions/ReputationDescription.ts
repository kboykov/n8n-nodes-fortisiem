import type { INodeProperties } from 'n8n-workflow';

export const reputationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['reputation'],
			},
		},
		options: [
			{
				name: 'Check Domain',
				value: 'checkDomain',
				description: 'Get the reputation of one or more domains',
				action: 'Check domain reputation',
			},
			{
				name: 'Check Hash',
				value: 'checkHash',
				description: 'Get the reputation of one or more file hashes',
				action: 'Check hash reputation',
			},
			{
				name: 'Check IP',
				value: 'checkIp',
				description: 'Get the reputation of one or more IP addresses',
				action: 'Check IP reputation',
			},
			{
				name: 'Check URL',
				value: 'checkUrl',
				description: 'Get the reputation of one or more URLs',
				action: 'Check URL reputation',
			},
		],
		default: 'checkIp',
	},
];

export const reputationFields: INodeProperties[] = [
	{
		displayName: 'Values',
		name: 'values',
		type: 'string',
		default: '',
		required: true,
		placeholder: '45.227.253.54, 8.8.8.8',
		description:
			'Comma-separated list of values to check (IP addresses, domains, hashes or URLs depending on the operation)',
		displayOptions: {
			show: {
				resource: ['reputation'],
			},
		},
	},
];
