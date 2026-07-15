import type { INodeProperties } from 'n8n-workflow';

export const caseOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['case'],
			},
		},
		options: [
			{
				name: 'Add Attachment',
				value: 'addAttachment',
				description: 'Upload a file attachment to an existing case',
				action: 'Add an attachment to a case',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new case',
				action: 'Create a case',
			},
			{
				name: 'Get Analysts',
				value: 'getAnalysts',
				description: 'Get the analysts that can be assigned to a case',
				action: 'Get case analysts',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing case',
				action: 'Update a case',
			},
		],
		default: 'create',
	},
];

const severityOptions = [
	{ name: 'Critical', value: 'Critical' },
	{ name: 'High', value: 'High' },
	{ name: 'Medium', value: 'Medium' },
	{ name: 'Low', value: 'Low' },
];

export const caseFields: INodeProperties[] = [
	// create
	{
		displayName: 'Organization',
		name: 'organization',
		type: 'string',
		default: 'super',
		required: true,
		description: 'Organization name the case belongs to',
		displayOptions: { show: { resource: ['case'], operation: ['create'] } },
	},
	{
		displayName: 'Summary',
		name: 'summary',
		type: 'string',
		default: '',
		required: true,
		description: 'Summary of the case',
		displayOptions: { show: { resource: ['case'], operation: ['create'] } },
	},
	{
		displayName: 'Assignee',
		name: 'assignee',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'admin',
		description: 'User the case is assigned to (see Get Analysts)',
		displayOptions: { show: { resource: ['case'], operation: ['create'] } },
	},
	{
		displayName: 'Severity',
		name: 'severity',
		type: 'options',
		default: 'Low',
		required: true,
		options: severityOptions,
		displayOptions: { show: { resource: ['case'], operation: ['create'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['case'], operation: ['create'] } },
		options: [
			{
				displayName: 'Case Management Policy',
				name: 'caseMgmtPolicy',
				type: 'string',
				default: '',
				description:
					'Case management policy name (Admin > Settings > General > Case Management > Case Management Policy)',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				typeOptions: { rows: 2 },
				default: '',
				description: 'Additional notes',
			},
			{
				displayName: 'Incident IDs',
				name: 'incidentIds',
				type: 'string',
				default: '',
				placeholder: '170,474',
				description:
					'Comma-separated incident IDs. An incident can only be assigned to one case at a time.',
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
				description: 'Due date of the case',
			},
		],
	},

	// update
	{
		displayName: 'Case ID',
		name: 'caseId',
		type: 'number',
		default: 0,
		required: true,
		description: 'Unique identifier of the case',
		displayOptions: { show: { resource: ['case'], operation: ['update', 'addAttachment'] } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['case'], operation: ['update'] } },
		options: [
			{ displayName: 'Summary', name: 'summary', type: 'string', default: '' },
			{ displayName: 'Assignee', name: 'assignee', type: 'string', default: '' },
			{
				displayName: 'Severity',
				name: 'severity',
				type: 'options',
				default: 'Low',
				options: severityOptions,
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'string',
				default: '',
				placeholder: 'InProgress',
				description: 'Status of the case',
			},
			{
				displayName: 'Stage',
				name: 'stage',
				type: 'string',
				default: '',
				placeholder: 'Detection',
				description: 'Current stage of the case',
			},
			{
				displayName: 'Case Management Policy',
				name: 'caseMgmtPolicy',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				typeOptions: { rows: 2 },
				default: '',
				description: 'Adds a new note; does not change existing notes',
			},
			{
				displayName: 'Incident IDs',
				name: 'incidentIds',
				type: 'string',
				default: '',
				placeholder: '170,474',
				description: 'Comma-separated incident IDs',
			},
			{ displayName: 'Due Date', name: 'dueDate', type: 'dateTime', default: '' },
		],
	},

	// addAttachment
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		hint: 'The name of the input binary field containing the file to upload',
		displayOptions: { show: { resource: ['case'], operation: ['addAttachment'] } },
	},

	// getAnalysts
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['case'], operation: ['getAnalysts'] } },
		options: [
			{
				displayName: 'Organization',
				name: 'organization',
				type: 'string',
				default: '',
				description:
					'Case organization. Required in Service Provider mode, optional in Enterprise mode.',
			},
			{
				displayName: 'Time From',
				name: 'timeFrom',
				type: 'dateTime',
				default: '',
				description: 'Controls the case statistics window returned per analyst (max 90 days)',
			},
			{
				displayName: 'Time To',
				name: 'timeTo',
				type: 'dateTime',
				default: '',
				description: 'Upper bound of the case statistics window',
			},
			{ displayName: 'Start', name: 'start', type: 'number', default: 0 },
			{ displayName: 'Size', name: 'size', type: 'number', default: 100 },
		],
	},
];
