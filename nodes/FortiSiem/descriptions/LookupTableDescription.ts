import type { INodeProperties } from 'n8n-workflow';

export const lookupTableOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['lookupTable'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new lookup table definition',
				action: 'Create a lookup table',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a lookup table and all its entries',
				action: 'Delete a lookup table',
			},
			{
				name: 'Delete Data',
				value: 'deleteData',
				description: 'Delete one or more entries from a lookup table',
				action: 'Delete lookup table data',
			},
			{
				name: 'Get Data',
				value: 'getData',
				description: 'Get the entries of a lookup table',
				action: 'Get lookup table data',
			},
			{
				name: 'Get Import Status',
				value: 'getImportStatus',
				description: 'Check the status of a lookup table CSV import',
				action: 'Get lookup table import status',
			},
			{
				name: 'Import',
				value: 'import',
				description: 'Import a CSV file into a lookup table',
				action: 'Import lookup table data',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all lookup tables and their schema',
				action: 'List lookup tables',
			},
			{
				name: 'Update Data',
				value: 'updateData',
				description: 'Update a specific entry of a lookup table',
				action: 'Update lookup table data',
			},
		],
		default: 'list',
	},
];

const SAMPLE_CREATE = JSON.stringify(
	{
		name: 'csurl_scores',
		description: '',
		organizationName: 'Super',
		columnList: [{ name: 'url', type: 'STRING', primaryKey: true }],
	},
	null,
	2,
);

export const lookupTableFields: INodeProperties[] = [
	// list
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['lookupTable'], operation: ['list'] } },
		options: [
			{ displayName: 'Start', name: 'status', type: 'number', default: 0, description: 'Offset' },
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				default: 25,
				description: 'Number of items to return (default 25, max 1000)',
			},
		],
	},

	// create
	{
		displayName: 'Lookup Table (JSON)',
		name: 'bodyJson',
		type: 'json',
		default: SAMPLE_CREATE,
		required: true,
		description: 'The lookup table definition including its column list',
		displayOptions: { show: { resource: ['lookupTable'], operation: ['create'] } },
	},

	// shared lookupTableId
	{
		displayName: 'Lookup Table ID',
		name: 'lookupTableId',
		type: 'number',
		default: 0,
		required: true,
		description: 'Unique identifier of the lookup table',
		displayOptions: {
			show: {
				resource: ['lookupTable'],
				operation: [
					'delete',
					'getData',
					'updateData',
					'deleteData',
					'import',
					'getImportStatus',
				],
			},
		},
	},

	// getData
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['lookupTable'], operation: ['getData'] } },
		options: [
			{ displayName: 'Start', name: 'start', type: 'number', default: 0 },
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				default: 25,
				description: 'Number of items to return (default 25, max 1000)',
			},
			{ displayName: 'Search Text', name: 'searchText', type: 'string', default: '' },
			{
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'string',
				default: '',
				placeholder: 'score DESC',
				description: 'Format: <ColumnName> <ASC|DESC>',
			},
		],
	},

	// updateData
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		default: '',
		required: true,
		placeholder: '{"url":"http://example.com"}',
		description: 'The primary key column and value identifying the row to update, as a JSON object',
		displayOptions: { show: { resource: ['lookupTable'], operation: ['updateData'] } },
	},
	{
		displayName: 'Entry (JSON)',
		name: 'bodyJson',
		type: 'json',
		default: '{\n  "score": 0.5\n}',
		required: true,
		description: 'The column values to set for the entry',
		displayOptions: { show: { resource: ['lookupTable'], operation: ['updateData'] } },
	},

	// deleteData
	{
		displayName: 'Entries (JSON)',
		name: 'bodyJson',
		type: 'json',
		default: '[\n  { "url": "http://example.com/case1" }\n]',
		required: true,
		description: 'Array of primary-key objects identifying the entries to delete',
		displayOptions: { show: { resource: ['lookupTable'], operation: ['deleteData'] } },
	},

	// import
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		hint: 'Name of the input binary field containing the CSV file',
		displayOptions: { show: { resource: ['lookupTable'], operation: ['import'] } },
	},
	{
		displayName: 'Mapping (JSON)',
		name: 'mapping',
		type: 'string',
		default: '',
		required: true,
		placeholder: '{"url":1,"score":2}',
		description: 'Maps lookup table column names to 1-based CSV column positions',
		displayOptions: { show: { resource: ['lookupTable'], operation: ['import'] } },
	},
	{
		displayName: 'Import Options',
		name: 'importOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['lookupTable'], operation: ['import'] } },
		options: [
			{
				displayName: 'File Separator',
				name: 'fileSeparator',
				type: 'string',
				default: ',',
				description: 'CSV field separator (default comma)',
			},
			{
				displayName: 'File Quote Character',
				name: 'fileQuoteChar',
				type: 'string',
				default: '"',
				description: 'CSV quote character (default double quote)',
			},
			{
				displayName: 'Skip Header',
				name: 'skipHeader',
				type: 'boolean',
				default: false,
				description: 'Whether to ignore the CSV header row',
			},
			{
				displayName: 'Update Type',
				name: 'updateType',
				type: 'options',
				default: 'Overwrite',
				options: [
					{ name: 'Overwrite', value: 'Overwrite' },
					{ name: 'Append', value: 'Append' },
				],
			},
		],
	},

	// getImportStatus
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'number',
		default: 0,
		required: true,
		description: 'The import task ID returned by the Import operation',
		displayOptions: { show: { resource: ['lookupTable'], operation: ['getImportStatus'] } },
	},
];
