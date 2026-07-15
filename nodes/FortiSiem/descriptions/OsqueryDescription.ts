import type { INodeProperties } from 'n8n-workflow';

export const osqueryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['osquery'],
			},
		},
		options: [
			{
				name: 'Run',
				value: 'run',
				description: 'Run an Osquery on one or more agents',
				action: 'Run an osquery',
			},
			{
				name: 'Get Progress',
				value: 'getProgress',
				description: 'Check the progress of submitted Osquery jobs',
				action: 'Get osquery progress',
			},
			{
				name: 'Get Result',
				value: 'getResult',
				description: 'Get the results of Osquery jobs',
				action: 'Get osquery result',
			},
		],
		default: 'run',
	},
];

export const osqueryFields: INodeProperties[] = [
	// run
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		required: true,
		placeholder: "select name, path from processes where LOWER(name) = 'explorer.exe';",
		description: 'The Osquery SQL statement to execute on the agent(s)',
		displayOptions: { show: { resource: ['osquery'], operation: ['run'] } },
	},
	{
		displayName: 'Agent IDs',
		name: 'agentIds',
		type: 'string',
		default: '',
		placeholder: '101,102',
		description: 'Comma-separated list of agent IDs to run the query on',
		displayOptions: { show: { resource: ['osquery'], operation: ['run'] } },
	},
	{
		displayName: 'Host Names',
		name: 'hostNames',
		type: 'string',
		default: '',
		placeholder: 'host1.example.com,host2.example.com',
		description: 'Comma-separated list of host names to run the query on',
		displayOptions: { show: { resource: ['osquery'], operation: ['run'] } },
	},

	// progress / result
	{
		displayName: 'Task IDs',
		name: 'taskIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: '5001,5002',
		description: 'Comma-separated list of task IDs returned by Run',
		displayOptions: { show: { resource: ['osquery'], operation: ['getProgress', 'getResult'] } },
	},
];
