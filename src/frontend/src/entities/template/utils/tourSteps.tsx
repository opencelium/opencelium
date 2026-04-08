import {Step} from "react-joyride";
import React from "react";

export const ConnectionTemplateEmptyListSteps: Step[] = [
    {
        title: 'Connection template',
        content:
            <span>The Templates section contains predefined connection configurations that can be reused to quickly create new Connections.</span>
        ,
        target: '#template-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Import template(s)',
        content:
            'Press Import Template(s) to upload one or many templates.',
        target: '#connection-template-list-import',
        placement: 'bottom',
        disableBeacon: true,
    },
]

export const ConnectionTemplateListSteps: Step[] = [
    {
        title: 'Connection template',
        content:
            <span>The Templates section contains predefined connection configurations that can be reused to quickly create new Connections.</span>
        ,
        target: '#template-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Import template(s)',
        content:
            'Press Import Template(s) to upload one or many templates.',
        target: '#connection-template-list-import',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Delete Templates',
        content:
            'Select templates that you want to delete and press here to do an action.',
        target: '#connection-template-list-delete-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Search',
        content:
            'Type here to search for a template by name.',
        target: '#collection-search-input',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Sort',
        content:
            'Click the column header to sort templates by name in ascending or descending order.',
        target: '#sort_button_name',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Convert',
        content:
            'Convert the template to its current version.',
        target: '[id^="conversion_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Download',
        content:
            'Download the template as json file.',
        target: '[id^="download_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Delete',
        content:
            <p>
                <p>Permanently remove the connection template from the system.</p><p><strong>This action
                cannot be undone!</strong></p>
            </p>,
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]
export const ImportTemplateFile: Step[] = [{
    title: 'Import Template(s)',
    content: <span>
        You can upload one template as json file or a zip file with archived json templates.
    </span>,
    target: '',
    placement: 'right',
    disableBeacon: true,
    hideCloseButton: true,
    hideFooter: true,
}]
