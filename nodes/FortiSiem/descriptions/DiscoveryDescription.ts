import type { INodeProperties } from 'n8n-workflow';

export const discoveryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['discovery'],
			},
		},
		options: [
			{
				name: 'Discover',
				value: 'discover',
				description: 'Submit a job to discover devices in a specific IP range',
				action: 'Discover devices',
			},
			{
				name: 'Get Status',
				value: 'getStatus',
				description: 'Get the status of a submitted discovery job',
				action: 'Get discovery status',
			},
			{
				name: 'Update Credential',
				value: 'updateCredential',
				description: 'Create or update device credentials and IP-to-credential mappings',
				action: 'Update device credential',
			},
		],
		default: 'discover',
	},
];

const DISCOVER_XML = `<discoverRequest>
  <type>SmartScan</type>
  <rootIP>10.1.1.1</rootIP>
  <includeRange>10.1.1.0/24</includeRange>
  <excludeRange></excludeRange>
  <noPing>false</noPing>
  <onlyPing>false</onlyPing>
</discoverRequest>`;

const CREDENTIAL_XML = `<accessMethods>
  <accessMethod>
    <name>MS-WMI-Domain_ABC</name>
    <accessProtocol>MS_WMI</accessProtocol>
    <pwdType>Manual</pwdType>
  </accessMethod>
</accessMethods>`;

export const discoveryFields: INodeProperties[] = [
	{
		displayName: 'Discovery XML',
		name: 'discoveryXml',
		type: 'string',
		typeOptions: { rows: 10 },
		default: DISCOVER_XML,
		required: true,
		description:
			'Discovery definition as XML. includeRange is required and accepts a single IP, range, CIDR or comma-separated list.',
		displayOptions: {
			show: {
				resource: ['discovery'],
				operation: ['discover'],
			},
		},
	},
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'number',
		default: 0,
		required: true,
		description: 'The task ID returned by Discover',
		displayOptions: {
			show: {
				resource: ['discovery'],
				operation: ['getStatus'],
			},
		},
	},
	{
		displayName: 'Credential XML',
		name: 'credentialXml',
		type: 'string',
		typeOptions: { rows: 10 },
		default: CREDENTIAL_XML,
		required: true,
		description: 'Credential and IP-mapping definition as XML',
		displayOptions: {
			show: {
				resource: ['discovery'],
				operation: ['updateCredential'],
			},
		},
	},
];
