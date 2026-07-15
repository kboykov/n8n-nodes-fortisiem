import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class FortiSiemApi implements ICredentialType {
	name = 'fortiSiemApi';

	displayName = 'FortiSIEM API';

	documentationUrl =
		'https://docs.fortinet.com/document/fortisiem/7.5.1/api-reference';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://your-fortisiem-supervisor',
			description:
				'Base URL of your FortiSIEM Supervisor (or FortiSIEM Manager), including protocol and optional port, without a trailing slash',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'options',
			options: [
				{
					name: 'Basic Auth',
					value: 'basicAuth',
					description: 'Authenticate with an organization/user name and password',
				},
				{
					name: 'Access Token (OAuth Client Credentials)',
					value: 'accessToken',
					description:
						'Exchange a Client ID and Client Secret for a bearer token (FortiSIEM 7.x API token)',
				},
			],
			default: 'basicAuth',
		},

		// ---- Basic auth ----
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description:
				'FortiSIEM API user as <organization>/<user> (for the default organization, e.g. super/admin)',
			displayOptions: {
				show: {
					authentication: ['basicAuth'],
				},
			},
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				show: {
					authentication: ['basicAuth'],
				},
			},
		},

		// ---- Access token (client credentials) ----
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			description: 'Client ID generated in FortiSIEM (Admin > Settings > API Token)',
			displayOptions: {
				show: {
					authentication: ['accessToken'],
				},
			},
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Client Secret paired with the Client ID',
			displayOptions: {
				show: {
					authentication: ['accessToken'],
				},
			},
		},

		{
			displayName: 'Ignore SSL Issues (Insecure)',
			name: 'allowUnauthorizedCerts',
			type: 'boolean',
			default: false,
			description:
				'Whether to connect even if SSL certificate validation fails. FortiSIEM appliances often use self-signed certificates.',
		},
	];
}
