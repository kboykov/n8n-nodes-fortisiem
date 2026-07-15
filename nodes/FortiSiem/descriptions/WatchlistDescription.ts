import type { INodeProperties } from 'n8n-workflow';

export const watchlistOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['watchlist'],
			},
		},
		options: [
			{
				name: 'Add Entry',
				value: 'addEntry',
				description: 'Add an entry to a watchlist',
				action: 'Add an entry to a watchlist',
			},
			{
				name: 'Create Group',
				value: 'createGroup',
				description: 'Create a new watchlist group',
				action: 'Create a watchlist group',
			},
			{
				name: 'Delete Entry',
				value: 'deleteEntry',
				description: 'Delete one or more watchlist entries',
				action: 'Delete a watchlist entry',
			},
			{
				name: 'Get By Entry',
				value: 'getByEntry',
				description: 'Get the watchlist that contains a specific entry',
				action: 'Get a watchlist by entry',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Retrieve all watchlists',
				action: 'Get many watchlists',
			},
		],
		default: 'getMany',
	},
];

export const watchlistFields: INodeProperties[] = [
	// -------------------------------------------
	// watchlist: getByEntry
	// -------------------------------------------
	{
		displayName: 'Entry ID',
		name: 'entryId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the watchlist entry to look up',
		displayOptions: {
			show: {
				resource: ['watchlist'],
				operation: ['getByEntry'],
			},
		},
	},

	// -------------------------------------------
	// watchlist: addEntry
	// -------------------------------------------
	{
		displayName: 'Watchlist ID',
		name: 'watchlistId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the watchlist to add the entry to',
		displayOptions: {
			show: {
				resource: ['watchlist'],
				operation: ['addEntry'],
			},
		},
	},

	// -------------------------------------------
	// watchlist: addEntry / createGroup / deleteEntry (raw body)
	// -------------------------------------------
	{
		displayName: 'Body',
		name: 'body',
		type: 'string',
		typeOptions: {
			rows: 8,
		},
		default: '',
		required: true,
		description: 'The JSON payload for the request',
		displayOptions: {
			show: {
				resource: ['watchlist'],
				operation: ['addEntry', 'createGroup', 'deleteEntry'],
			},
		},
	},
];
