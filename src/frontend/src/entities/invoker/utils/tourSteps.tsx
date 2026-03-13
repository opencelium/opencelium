import {Step} from "react-joyride";
import React from "react";

export const InvokerEmptyListSteps: Step[] = [
    {
        title: 'Invoker',
        content:<div>
            <p>
                The Invokers section contains all configured external system integrations available in OpenCelium. An Invoker represents a connection interface to an external API or service.
                It defines how OpenCelium communicates with external systems.
            </p>
            <p>See <a target={'_blank'} href={'https://docs.opencelium.io/en/prod/management/invoker.html'}>docs</a> for more information.</p>
        </div>
        ,
        target: '#invoker-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Invoker',
        content:
            'Press Add Invoker to create a new invoker.',
        target: '#invoker-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Import Invoker',
        content:
            'You can import a new invoker as xml file in specific structure.',
        target: '#invoker-list-import',
        placement: 'bottom',
        disableBeacon: true,
    },
]

export const InvokerListSteps: Step[] = [
    {
        title: 'Invoker',
        content:<div>
            <p>
                The Invokers section contains all configured external system integrations available in OpenCelium. An Invoker represents a connection interface to an external API or service.
                It defines how OpenCelium communicates with external systems.
            </p>
            <p>See <a target={'_blank'} href={'https://docs.opencelium.io/en/prod/management/invoker.html'}>docs</a> for more information.</p>
        </div>
        ,
        target: '#invoker-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Invoker',
        content:
            'Press Add Invoker to create a new invoker.',
        target: '#invoker-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Import Invoker',
        content:
            'You can import a new invoker as xml file in specific structure.',
        target: '#invoker-list-import',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Delete Invokers',
        content:
            'Select invokers that you want to delete and press here to do an action.',
        target: '#invoker-list-delete-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Search',
        content:
            'Type here to search for an invoker by name.',
        target: '#collection-search-input',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Sync',
        content:
        <div>
            <p>
                If you have configured the synchronization with Service Portal then you can force update your invoker
                with current version.
                <br/>
                <br/>
                <strong>Important</strong>:
                <p>
                    All changes that you have made manually will be deleted.
                </p>
            </p>
        </div>,
        target: '[id^="sync_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'View',
        content:
            'Open the invoker in read-only mode to review its details.',
        target: '[id^="view_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Delete',
        content:<p>
            <p>Permanently remove the invoker from the system.</p><p> <strong>This action cannot be undone!</strong></p>
        </p>,
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]

export const InvokerFormTours: Step[] = [
    {
        title: 'General Data',
        content:<p>
            This section defines the basic information about the external integration.
        </p>,
        target: '#invoker-form-general-data',
        placement: 'right',
        disableBeacon: true,
    },
    {
        title: 'Authentication',
        content:<p>
            This section defines how OpenCelium authenticates against the external API.
        </p>,
        target: '#invoker-form-authentication',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Operations',
        content:<p>
            This section defines the API operations available for this Invoker. Each operation represents a callable endpoint.
        </p>,
        target: '#invoker-form-operations',
        placement: 'top',
        disableBeacon: true,
    },
]
