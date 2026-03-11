import React from "react";
import {Step} from "react-joyride";

export const AddConnectorTourSteps: Step[] = [
    {
        title: 'General Data',
        content:
            'The General Data section defines the basic configuration of the connector, including its name, description, execution settings, and the selected invoker.',
        target: '#connector-form-general-data',
        placement: 'right',
        disableBeacon: true,
    },
    {
        title: 'Credentials',
        content:
            'The Credentials section becomes available after an invoker is selected. It contains invoker-specific configuration fields required to authenticate and communicate with the target system.',
        target: '#connector-form-credentials',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Test Credentials',
        content:
            'Test the connection to the target system using the provided authentication details.',
        target: '#test_button',
        placement: 'left',
        disableBeacon: true,
    },
]
export const UpdateConnectorWithMaskTourSteps: Step[] = [
    AddConnectorTourSteps[0],
    {
        title: 'Master Password',
        content:
            'You need to provide master password in order to update credentials. This is required to securely store and encrypt sensitive configuration data.',
        target: '#master-password-container',
        placement: 'bottom',
        disableBeacon: true,
    },
]
export const UpdateConnectorWithoutMaskTourSteps: Step[] = AddConnectorTourSteps;

export const InvokerInputStep: Step[] = [{
    title: 'Invoker',
    content: `An Invoker is a predefined configuration that defines how OpenCelium communicates with a specific API.
Select an invoker to configure the connection and authentication settings.`,
    target: '',
    placement: 'right',
    disableBeacon: true,
    hideCloseButton: true,
    hideFooter: true,
}]

export const MasterPasswordStep: Step[] = [
    {
        title: 'Master Password',
        content: <span>
            <span>The Request Data section defines the payload that will be sent to the target system.
You can specify static values or dynamically reference data from previous request results and webhooks.</span>
            </span>,
        target: '',
        placement: 'right',
        disableBeacon: true,
        hideCloseButton: true,
        hideFooter: true,
    }
]

export const EmptyConnectorListSteps: Step[] = [
    {
        title: 'Connectors',
        content:
            'Connectors are core components of OpenCelium. They represent external or internal systems used to send requests and receive responses.',
        target: '#connector-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Connector',
        content:
            'Press Add Connector to create a new connector.',
        target: '#connector-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
]

export const ConnectorListSteps: Step[] = [
    {
        title: 'Connectors',
        content:
            'Connectors are core components of OpenCelium. They represent external or internal systems used to send requests and receive responses.',
        target: '#connector-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Connector',
        content:
            'Press Add Connector to create a new connector.',
        target: '#connector-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Delete Connectors',
        content:
            'Select connectors that you want to delete and press here to do an action.',
        target: '#connector-list-delete-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Search',
        content:
            'Type here to search for a connector by title, description or invoker name.',
        target: '#collection-search-input',
        placement: 'bottom',
        disableBeacon: true,
    },

    {
        title: 'Sort',
        content:
            'Click the column header to sort connectors by title in ascending or descending order.',
        target: '#sort_button_title',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'View',
        content:
            'Open the connector in read-only mode to review its configuration and details.',
        target: '[id^="view_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Update',
        content:
            'Update the connector configuration, including connection settings and credentials.',
        target: '[id^="update_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Delete',
        content:<p>
            <p>Permanently remove the connector and assigned connections from the system.</p><p> <strong>This action cannot be undone!</strong></p>
        </p>,
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]
