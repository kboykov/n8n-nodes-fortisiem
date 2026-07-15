import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FortiSiemApi implements ICredentialType {
	name = 'fortiSiemApi';

	displayName = 'FortiSIEM API';

	documentationUrl =
		'https://docs.fortinet.com/document/fortisiem/6.4.0/integration-api-guide/895612/json-api-incident-integration';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://your-fortisiem-supervisor',
			description:
				'Base URL of your FortiSIEM Supervisor, including protocol and (optional) port, without a trailing slash',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
			description:
				'FortiSIEM API user in the form <organization>/<user> (for the default organization, e.g. super/admin)',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
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

	// FortiSIEM's REST API uses HTTP Basic authentication.
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};

	// Validate the credentials by listing monitored organizations.
	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			baseURL: '={{$credentials.baseUrl}}',
			url: '/phoenix/rest/config/Domain',
			skipSslCertificateValidation: '={{$credentials.allowUnauthorizedCerts}}',
		},
	};
}
