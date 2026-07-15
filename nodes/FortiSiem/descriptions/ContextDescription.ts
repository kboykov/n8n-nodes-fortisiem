import type { INodeProperties } from 'n8n-workflow';

export const contextOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['context'],
			},
		},
		options: [
			{
				name: 'Get by Hostname',
				value: 'getByHostname',
				description: 'Get all known context for a hostname from CMDB',
				action: 'Get context by hostname',
			},
			{
				name: 'Get by IP',
				value: 'getByIp',
				description: 'Get all known context for an IP address from CMDB',
				action: 'Get context by IP',
			},
			{
				name: 'Get by User',
				value: 'getByUser',
				description: 'Get all known context for a user from CMDB',
				action: 'Get context by user',
			},
		],
		default: 'getByIp',
	},
];

export const contextFields: INodeProperties[] = [
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		default: '',
		required: true,
		placeholder: '10.1.1.1',
		description: 'The hostname, IP address or user name to retrieve context for',
		displayOptions: {
			show: {
				resource: ['context'],
			},
		},
	},
];
