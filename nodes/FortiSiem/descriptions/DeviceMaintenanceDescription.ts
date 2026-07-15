import type { INodeProperties } from 'n8n-workflow';

export const deviceMaintenanceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['deviceMaintenance'],
			},
		},
		options: [
			{
				name: 'Create or Update Schedule',
				value: 'updateSchedule',
				description: 'Create a new maintenance schedule or update an existing one',
				action: 'Create or update a maintenance schedule',
			},
			{
				name: 'Delete Schedule',
				value: 'deleteSchedule',
				description:
					'Delete a maintenance schedule (note: broken in FortiSIEM 7.5.1 due to a known bug)',
				action: 'Delete a maintenance schedule',
			},
		],
		default: 'updateSchedule',
	},
];

const MAINT_XML = `<MaintSchedule>
  <name>My schedule</name>
  <description>Weekend maintenance</description>
  <fireIncidents>true</fireIncidents>
  <timeZoneId>America/Anchorage</timeZoneId>
  <devices></devices>
  <groups></groups>
  <schedule></schedule>
</MaintSchedule>`;

export const deviceMaintenanceFields: INodeProperties[] = [
	{
		displayName: 'Maintenance Schedule XML',
		name: 'scheduleXml',
		type: 'string',
		typeOptions: { rows: 12 },
		default: MAINT_XML,
		required: true,
		description: 'The maintenance schedule definition as XML. The "name" element is required.',
		displayOptions: {
			show: {
				resource: ['deviceMaintenance'],
			},
		},
	},
];
