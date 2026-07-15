import type { INodeProperties } from 'n8n-workflow';

export const deviceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['device'],
			},
		},
		options: [
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete one or more CMDB devices by ID',
				action: 'Delete devices',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List CMDB devices and their properties',
				action: 'List CMDB devices',
			},
			{
				name: 'List Monitored',
				value: 'listMonitored',
				description: 'List monitored devices (Admin > Setup > Monitor Performance)',
				action: 'List monitored devices',
			},
			{
				name: 'Update Monitoring',
				value: 'updateMonitoring',
				description: 'Update device monitoring parameters (system monitors, event pulling)',
				action: 'Update device monitoring',
			},
		],
		default: 'list',
	},
];

const UPDATE_MONITOR_XML = `<systemMonitors>
  <systemMonitor>
    <!-- monitor definition -->
  </systemMonitor>
</systemMonitors>`;

export const deviceFields: INodeProperties[] = [
	// list
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['device'], operation: ['list'] } },
		options: [
			{
				displayName: 'Start',
				name: 'start',
				type: 'number',
				default: 0,
				description: 'Pagination offset',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'number',
				default: 50,
				description: 'Records per page (default 50)',
			},
			{
				displayName: 'Organization ID (custId)',
				name: 'custId',
				type: 'number',
				default: 0,
				description: 'Organization ID to query (for super users)',
			},
			{
				displayName: 'Modified After',
				name: 'lastModifiedTime',
				type: 'dateTime',
				default: '',
				description: 'Return only devices modified after this time',
			},
			{
				displayName: 'Include IPs',
				name: 'includeIps',
				type: 'string',
				default: '',
				placeholder: '10.10.10.1,10.10.10.2',
				description: 'Comma-separated IP list to include',
			},
			{
				displayName: 'Exclude IPs',
				name: 'excludeIps',
				type: 'string',
				default: '',
				placeholder: '192.168.0.1,192.168.0.2',
				description: 'Comma-separated IP list to exclude',
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'string',
				default: '',
				placeholder: 'id,name,accessIp,deviceType.vendor',
				description: 'Comma-separated fields to return. If set, "id" must be included.',
			},
			{
				displayName: 'Filter (JSON)',
				name: 'filter',
				type: 'json',
				default: '{}',
				description:
					'Filter object. Supported keys include id, name, accessIp, deviceType.vendor, deviceType.model, status, agentType, location, deviceTag.',
			},
		],
	},

	// delete
	{
		displayName: 'Device IDs',
		name: 'deviceIds',
		type: 'string',
		default: '',
		required: true,
		placeholder: '1086708,1086709',
		description: 'Comma-separated list of device IDs to delete',
		displayOptions: { show: { resource: ['device'], operation: ['delete'] } },
	},

	// updateMonitoring
	{
		displayName: 'Monitoring XML',
		name: 'monitoringXml',
		type: 'string',
		typeOptions: { rows: 10 },
		default: UPDATE_MONITOR_XML,
		required: true,
		description: 'XML describing the system monitors and/or event pulling objects to update',
		displayOptions: { show: { resource: ['device'], operation: ['updateMonitoring'] } },
	},
];
