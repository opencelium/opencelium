import {Step} from "react-joyride";

export const EmptyConnectionListSteps: Step[] = [
    {
        title: 'Connections',
        content:
            'Connections define how connectors interact with each other, including request flow, data mapping, and communication logic.',
        target: '#connection-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Connection',
        content:
            'You can create a connection from scratch or create using a template.',
        target: '#connection-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
];
export const ConnectionListSteps: Step[] = [
    {
        title: 'Connections',
        content:
            'Connections define how connectors interact with each other, including request flow, data mapping, and communication logic.',
        target: '#connection-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Connection',
        content:
            'You can create a connection from scratch or create using a template.',
        target: '#connection-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Delete Connections',
        content:
            'Select connections that you want to delete and press here to do an action.',
        target: '#connection-list-delete-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Search',
        content:
            'Type here to search for a connection by title, description or connectors\' name.',
        target: '#collection-search-input',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Category',
        content:
            'It allows you to create a category to organize and group connections, for example by the connectors they use or their functional purpose.',
        target: '#tab-create-category',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Sort by title',
        content:
            'Click the column header to sort connections by title in ascending or descending order.',
        target: '#sort_button_title',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Sort by description',
        content:
            'Click the column header to sort connections by description in ascending or descending order.',
        target: '#sort_button_description',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Sort by From Connector name',
        content:
            'Click the column header to sort connections by From Connector name in ascending or descending order.',
        target: '#sort_button_fromConnector_title',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Sort by To Connector name',
        content:
            'Click the column header to sort connections by To Connector name in ascending or descending order.',
        target: '#sort_button_toConnector_title',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Duplicate',
        content:
            'This action allows you to create a duplicate of an existing connection by selecting its source and target connectors and defining basic properties for the new connection.',
        target: '[id^="duplicate_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'View',
        content:
            'Open the connection in read-only mode to review its configuration and details.',
        target: '[id^="view_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Update',
        content:
            'Update the connection configuration.',
        target: '[id^="update_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Delete',
        content:
            'Permanently remove the connection and assigned schedules from the system. This action cannot be undone.',
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Download as Template',
        content:
            'This action allows you to download a connection as a template file.',
        target: '[id^="download_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]
