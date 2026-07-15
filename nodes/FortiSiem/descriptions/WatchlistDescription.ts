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
				name: 'Add Entries',
				value: 'addEntries',
				description: 'Add one or more entries to a watchlist',
				action: 'Add watchlist entries',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new watchlist and populate its entries',
				action: 'Create a watchlist',
			},
			{
				name: 'Delete Entries',
				value: 'deleteEntries',
				description: 'Delete specific entries within watchlists by entry ID',
				action: 'Delete watchlist entries',
			},
			{
				name: 'Delete Watchlists',
				value: 'deleteWatchlists',
				description: 'Delete entire watchlists (including their entries) by ID',
				action: 'Delete watchlists',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a specific watchlist and all its entries',
				action: 'Get a watchlist',
			},
			{
				name: 'Get by Value',
				value: 'getByValue',
				description: 'Get all watchlists that contain a given entry value',
				action: 'Get watchlists by value',
			},
			{
				name: 'Get Containing Watchlist',
				value: 'getContainingWatchlist',
				description: 'Get the watchlist that contains a given entry ID',
				action: 'Get the watchlist containing an entry',
			},
			{
				name: 'Get Count',
				value: 'getCount',
				description: 'Get the entry count for all watchlists or a specific one',
				action: 'Get watchlist entry count',
			},
			{
				name: 'Get Entries by Type',
				value: 'getEntriesByType',
				description: 'Get all IP, hash or domain entries of a watchlist (one per line)',
				action: 'Get watchlist entries by type',
			},
			{
				name: 'Get Entry',
				value: 'getEntry',
				description: 'Get a single watchlist entry by its entry ID',
				action: 'Get a watchlist entry',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get all watchlists and their active entries',
				action: 'Get many watchlists',
			},
			{
				name: 'Get Summary',
				value: 'getSummary',
				description: 'Get watchlists and their schema, without entries',
				action: 'Get watchlist summary',
			},
			{
				name: 'Set Entry Active',
				value: 'setEntryActive',
				description: 'Enable or disable a specific watchlist entry',
				action: 'Set a watchlist entry active state',
			},
			{
				name: 'Set Entry Count',
				value: 'setEntryCount',
				description: 'Update the triggering incident count of a specific entry',
				action: 'Set a watchlist entry count',
			},
			{
				name: 'Set Entry Last Seen',
				value: 'setEntryLastSeen',
				description: 'Update the last seen time of a specific entry',
				action: 'Set a watchlist entry last seen time',
			},
			{
				name: 'Update Entry',
				value: 'updateEntry',
				description: 'Update the value of an existing watchlist entry',
				action: 'Update a watchlist entry',
			},
		],
		default: 'getMany',
	},
];

const SAMPLE_CREATE = JSON.stringify(
	[
		{
			displayName: 'My Example Watchlist',
			valueType: 'STRING',
			type: 32,
			dataCreationType: 'USER',
			description: 'Description of this watchlist',
			entries: [{ entryValue: 'myhost.example.com', ageOut: '2d' }],
		},
	],
	null,
	2,
);

const SAMPLE_ADD = JSON.stringify(
	[{ entryValue: 'myhost.example.com', state: 'Enabled', ageOut: '2d' }],
	null,
	2,
);

export const watchlistFields: INodeProperties[] = [
	// get (path watchlistId)
	{
		displayName: 'Watchlist ID',
		name: 'watchlistId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the watchlist (also referred to as group ID)',
		displayOptions: { show: { resource: ['watchlist'], operation: ['get'] } },
	},

	// addEntries (query watchlistId)
	{
		displayName: 'Watchlist ID',
		name: 'watchlistIdQuery',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the watchlist to add entries to',
		displayOptions: { show: { resource: ['watchlist'], operation: ['addEntries'] } },
	},
	{
		displayName: 'Entries (JSON)',
		name: 'entriesJson',
		type: 'json',
		default: SAMPLE_ADD,
		required: true,
		description:
			'Array of entry objects. At minimum each entry needs "entryValue"; other fields (firstSeen, lastSeen, expiredTime, state, description, ageOut, count) are optional.',
		displayOptions: { show: { resource: ['watchlist'], operation: ['addEntries'] } },
	},

	// create
	{
		displayName: 'Watchlists (JSON)',
		name: 'bodyJson',
		type: 'json',
		default: SAMPLE_CREATE,
		required: true,
		description:
			'Array of watchlist definitions. "type" must always be 32 and "dataCreationType" must be USER. valueType is one of STRING, IP or NUMBER.',
		displayOptions: { show: { resource: ['watchlist'], operation: ['create'] } },
	},

	// entry id (shared)
	{
		displayName: 'Watchlist Entry ID',
		name: 'watchlistEntryId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of an individual watchlist entry',
		displayOptions: {
			show: {
				resource: ['watchlist'],
				operation: [
					'getEntry',
					'getContainingWatchlist',
					'setEntryActive',
					'setEntryCount',
					'setEntryLastSeen',
				],
			},
		},
	},

	// setEntryActive
	{
		displayName: 'State',
		name: 'state',
		type: 'options',
		default: 'true',
		required: true,
		options: [
			{ name: 'Enable', value: 'true' },
			{ name: 'Disable', value: 'false' },
		],
		description: 'Whether to enable or disable the entry',
		displayOptions: { show: { resource: ['watchlist'], operation: ['setEntryActive'] } },
	},

	// setEntryCount
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		default: 0,
		required: true,
		description: 'The number of times the entry was seen / re-populated',
		displayOptions: { show: { resource: ['watchlist'], operation: ['setEntryCount'] } },
	},

	// setEntryLastSeen
	{
		displayName: 'Last Seen Time',
		name: 'lastSeenTime',
		type: 'dateTime',
		default: '',
		required: true,
		description: 'The last seen time for this entry',
		displayOptions: { show: { resource: ['watchlist'], operation: ['setEntryLastSeen'] } },
	},
	{
		displayName: 'Organization ID (custId)',
		name: 'custId',
		type: 'string',
		default: '1',
		required: true,
		description: 'Organization ID the entry belongs to (e.g. 1 for the Super organization)',
		displayOptions: { show: { resource: ['watchlist'], operation: ['setEntryLastSeen'] } },
	},

	// updateEntry
	{
		displayName: 'Entry ID',
		name: 'entryId',
		type: 'number',
		default: 0,
		required: true,
		description: 'The ID of the watchlist entry to update',
		displayOptions: { show: { resource: ['watchlist'], operation: ['updateEntry'] } },
	},
	{
		displayName: 'New Entry Value',
		name: 'entryValue',
		type: 'string',
		default: '',
		required: true,
		description: 'The new value for the watchlist entry',
		displayOptions: { show: { resource: ['watchlist'], operation: ['updateEntry'] } },
	},

	// getByValue
	{
		displayName: 'Entry Value',
		name: 'entryValue',
		type: 'string',
		default: '',
		required: true,
		description: 'The value to search for across watchlists',
		displayOptions: { show: { resource: ['watchlist'], operation: ['getByValue'] } },
	},
	{
		displayName: 'Organization ID (custId)',
		name: 'custId',
		type: 'string',
		default: '',
		description: 'Optional organization ID filter',
		displayOptions: { show: { resource: ['watchlist'], operation: ['getByValue'] } },
	},

	// getEntriesByType
	{
		displayName: 'Entry Type',
		name: 'entryType',
		type: 'options',
		default: 'ip',
		options: [
			{ name: 'IP', value: 'ip' },
			{ name: 'Hash', value: 'hash' },
			{ name: 'Domain', value: 'domain' },
		],
		description: 'Which type of entries to return',
		displayOptions: { show: { resource: ['watchlist'], operation: ['getEntriesByType'] } },
	},
	{
		displayName: 'Watchlist Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		description: 'The watchlist display name to query by',
		displayOptions: { show: { resource: ['watchlist'], operation: ['getEntriesByType'] } },
	},

	// getCount
	{
		displayName: 'Watchlist (Group) ID',
		name: 'groupId',
		type: 'number',
		default: 0,
		description: 'Optional watchlist ID. Leave 0 to count entries across all watchlists.',
		displayOptions: { show: { resource: ['watchlist'], operation: ['getCount'] } },
	},

	// getSummary options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['watchlist'], operation: ['getSummary'] } },
		options: [
			{
				displayName: 'Organization ID (custId)',
				name: 'custId',
				type: 'number',
				default: 0,
				description: 'Filter by organization (global watchlists are always included)',
			},
			{
				displayName: 'Watchlist ID',
				name: 'id',
				type: 'number',
				default: 0,
				description: 'Return the summary of a specific watchlist',
			},
		],
	},

	// deleteWatchlists / deleteEntries
	{
		displayName: 'IDs',
		name: 'ids',
		type: 'string',
		default: '',
		required: true,
		placeholder: '1517203,1517204',
		description: 'Comma-separated list of IDs to delete',
		displayOptions: {
			show: {
				resource: ['watchlist'],
				operation: ['deleteWatchlists', 'deleteEntries'],
			},
		},
	},
];
