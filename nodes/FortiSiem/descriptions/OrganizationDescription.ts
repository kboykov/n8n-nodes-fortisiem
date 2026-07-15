import type { INodeProperties } from 'n8n-workflow';

export const organizationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['organization'],
			},
		},
		options: [
			{
				name: 'Add',
				value: 'add',
				description: 'Add a new organization',
				action: 'Add an organization',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Retrieve the list of monitored organizations',
				action: 'Get many organizations',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an organization',
				action: 'Update an organization',
			},
		],
		default: 'getMany',
	},
];

export const organizationFields: INodeProperties[] = [
	// -------------------------------------------
	// organization: add
	// -------------------------------------------
	{
		displayName: 'Organization Definition',
		name: 'body',
		type: 'string',
		typeOptions: {
			rows: 8,
		},
		default: '',
		required: true,
		description:
			'The organization definition to add. Provide the XML or JSON payload expected by FortiSIEM.',
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: ['add'],
			},
		},
	},
];
