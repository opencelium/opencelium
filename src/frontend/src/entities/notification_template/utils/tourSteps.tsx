import React from 'react';
import {Step} from "react-joyride";
import {Link} from "react-router-dom";

export const NotificationTemplateEmptyListSteps: Step[] = [
    {
        title: 'Notification template',
        content:
            <span>Manage reusable templates used for notifications in <Link to={'/schedules'}>Schedules</Link>.</span>
        ,
        target: '#notification-template-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Notification template',
        content:
            'Press Add Notification Template to create a new notification template.',
        target: '#notification-template-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
]

export const NotificationTemplateListSteps: Step[] = [
    {
        title: 'Notification template',
        content:
            <span>Manage reusable templates used for notifications in <Link to={'/schedules'}>Schedules</Link>.</span>
        ,
        target: '#notification-template-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Notification template',
        content:
            'Press Add Notification Template to create a new notification template.',
        target: '#notification-template-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Delete Notification Templates',
        content:
            'Select notification templates that you want to delete and press here to do an action.',
        target: '#notification-template-list-delete-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Search',
        content:
            'Type here to search for a notification template by name.',
        target: '#collection-search-input',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Sort',
        content:
            'Click the column header to sort notification templates by name in ascending or descending order.',
        target: '#sort_button_name',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'View',
        content:
            'Open the notification template in read-only mode to review its details.',
        target: '[id^="view_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Update',
        content:
            'Update the notification template general data and template content.',
        target: '[id^="update_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Delete',
        content:
            <p>
                <p>Permanently remove the notification template from the system.</p><p><strong>This action
                cannot be undone!</strong></p>
            </p>,
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]

export const NotificationTemplateFormSteps: Step[] = [
    {
        title: 'General Data',
        content:
            <span>
                The General Data section defines the basic configuration of the notification template.
            </span>,
        target: '#notification-template-form-general-data',
        placement: 'right',
        disableBeacon: true,
    },
    {
        title: 'Template Content',
        content:
            <span>
                The Template Content section defines the actual notification message that will be sent.
            </span>,
        target: '#notification-template-form-template-content',
        placement: 'right',
        disableBeacon: true,
    },
]

export const NTAggregatorInputStep: Step[] = [{
    title: 'Data Aggregator',
    content: <span>
        Used to provide structured data for dynamic placeholders inside the template.
        It also helps format or enrich the data before it is inserted into the message.
        See <a target={'_blank'} href={'https://docs.opencelium.io/en/prod/management/aggregator.html'}>docs</a> for more information.
    </span>,
    target: '',
    placement: 'right',
    disableBeacon: true,
    hideCloseButton: true,
    hideFooter: true,
}]

export const NTBodyInputStep: Step[] = [{
    title: 'Body',
    content: <span>
        <span>Body can contain not only simple text but also arguments of data aggregator. See <a target={'_blank'} href={'https://docs.opencelium.io/en/prod/management/notification_template.html'}>docs</a> for more information.</span>
    </span>,
    target: '',
    placement: 'right',
    disableBeacon: true,
    hideCloseButton: true,
    hideFooter: true,
}]
