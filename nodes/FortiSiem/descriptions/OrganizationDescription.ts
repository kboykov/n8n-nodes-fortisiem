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
				description: 'Add an organization (Service Provider deployments)',
				action: 'Add an organization',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an organization by name (Service Provider deployments)',
				action: 'Delete an organization',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get a list of all organizations',
				action: 'Get many organizations',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update organization attributes (Service Provider deployments)',
				action: 'Update an organization',
			},
		],
		default: 'getMany',
	},
];

const SAMPLE_ORG_XML = `<organization>
  <name>OrganizationA</name>
  <fullName>Test Organization A</fullName>
  <description>OrganizationA account</description>
  <adminUser>organizationA</adminUser>
  <adminPwd>organization*A</adminPwd>
  <adminEmail>admin@orga.example.com</adminEmail>
  <includeRange>172.16.40.1-172.16.40.100</includeRange>
  <excludeRange>172.16.40.10,172.16.40.20</excludeRange>
</organization>`;

export const organizationFields: INodeProperties[] = [
	{
		displayName: 'Organization Name',
		name: 'organizationName',
		type: 'string',
		default: '',
		required: true,
		description: 'The organization name (not the display name) to delete',
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: ['delete'],
			},
		},
	},
	{
		displayName: 'Organization XML',
		name: 'organizationXml',
		type: 'string',
		typeOptions: { rows: 12 },
		default: SAMPLE_ORG_XML,
		required: true,
		description:
			'The organization definition as XML. Required fields: name (letters/digits/underscore only), adminUser, adminPwd, adminEmail.',
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: ['add', 'update'],
			},
		},
	},
];
