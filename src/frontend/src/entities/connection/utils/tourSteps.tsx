import React from "react";
import {Step} from "react-joyride";
import ReferenceExampleGif from "@image/tours/reference-example.gif";

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
            <p>
                <p>Permanently remove the connection and assigned schedules from the system.</p><p><strong>This action
                cannot be undone!</strong></p>
            </p>,
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

export const AddConnectionStepsWithoutConnectors: Step[] = [
    {
        title: 'Add Options',
        content:
            <span>
            There are two options to complete connection creation:
            <ul style={{marginLeft: '20px'}}>
                <li>
                    Creates the connection and closes the editor, returning to the connection list.
                </li>
                <li>Creates the connection and immediately navigates to the Schedule creation page.
                </li>
            </ul>
        </span>,
        target: '#connection-form-add-options',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Create Template',
        content:
            <span>
Templates allow you to standardize and reuse integration patterns. This option becomes available once the connection contains at least one configured method.
        </span>,
        target: '#connection-form-create-template',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Assign Aggregator',
        content:
            <span>
Assigns an aggregator to the configuration elements. This option is available only after the connection contains methods / operators.
        </span>,
        target: '#connection-form-assign-aggregator',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Cancel',
        content:
            <span>
Cancels the creation process without saving changes.
            </span>,
        target: '#connection-form-cancel',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Direction',
        content:
            'In this step, you define the basic structure of the connection, including its name, category, and the source and target connectors that will participate in the integration.',
        target: '#connection-form-direction',
        placement: 'right',
        disableBeacon: true,
    },
];
const ButtonPanel: Step[] = [

    {
        title: 'Test Run',
        content:
            `Executes the connection in test mode without creating a schedule. Used to validate configuration, request flow, and data processing logic.`,
        target: '#test_connection_button',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Save Options',
        content:
            <span>
            The save button provides three actions:
            <ul style={{marginLeft: '20px'}}>
                <li>Save — saves the connection and remains in the editor</li>
                <li>Save & Close — saves and exits the editor</li>
                <li>Save & Open Schedules — saves and navigates to the Schedule list</li>
            </ul>
        </span>,
        target: '#save_panel',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Expand / Collapse Editor',
        content:
            'Toggles full-screen mode to maximize the working area.',
        target: '#fullscreen_connection_button',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Logs Panel',
        content:
            'Opens or collapses the execution logs panel to review test run results and debugging information.',
        target: '#show_log_panel',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Settings',
        content:
            `Opens editor settings where you can configure visual layout preferences.`,
        target: '#settings_connection_button',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Aggregator Panel',
        content:
            `Opens the aggregator panel for configuring grouped or combined execution logic.`,
        target: '#aggregator',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Templates Options',
        content:
            <span>
            Template management options:
            <ul style={{marginLeft: '20px'}}>
                <li>Save as Template — saves the current connection configuration as a reusable template</li>
                <li>Load Template — loads a predefined template for the selected From and To connectors</li>
            </ul>
        </span>,
        target: '#template_panel',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Interactive Help',
        content:
            'Displays animated examples demonstrating how to create and configure connections.',
        target: '#help_connection_button',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Synchronize Invoker',
        content:
            'Synchronizes the selected invoker configuration after it has been updated.',
        target: '#sync_invokers',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Shortcuts',
        content:
            'Displays keyboard shortcuts for working efficiently with methods and operators.',
        target: '#shortcuts',
        placement: 'top',
        disableBeacon: true,
    },
]
const ConnectionFormMethodsWithoutOpenedButtonPanel: Step[] = [
    {
        title: 'Source Connector',
        content:
            'This panel represents the source connector and is used to define how data is requested or retrieved from the originating system.',
        target: '#fromConnector_panel',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Target Connector',
        content:
            'This panel represents the target connector and defines how the processed data is sent to the receiving system.',
        target: '#toConnector_panel',
        placement: 'top',
        disableBeacon: true,
    },
    {
        title: 'Details Panel',
        content:
            'Displays configuration details of the currently selected method or element in the flow.',
        target: '#connection-form-methods-details-panel',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Control Panel',
        content:
            'This panel provides tools for testing, saving, configuring, and managing the connection during the design process.',
        target: '#button_panel',
        placement: 'top',
        disableBeacon: true,
    },
]
const ConnectionWithOpenedButtonPanel: Step[]= [
    ...ConnectionFormMethodsWithoutOpenedButtonPanel,
    ...ButtonPanel,
]

export const ConnectionFormWithPanel: Step[] = [
    ...ConnectionWithOpenedButtonPanel,
];
export const ConnectionFormWithoutPanel: Step[] = [
    ...ConnectionFormMethodsWithoutOpenedButtonPanel,
];


export const ReferenceInfoSteps: Step[] = [
    {
        title: 'Reference Information',
        content: <span>
                The Reference Information section provides detailed documentation about available dynamic references, including their structure, data path and relation.
            </span>,
        target: '',
        placement: 'right',
        disableBeacon: true,
        hideCloseButton: true,
        hideFooter: true,
    }
]


export const RequestDataSteps: Step[] = [
    {
        title: 'Request Data',
        content: <div>
            <span>
                The Request Data section defines the payload that will be sent to the target system.
You can specify static values or dynamically reference data from previous request results and hooks.
                <br/>
                <br/>
                Example:
            </span>
            <div>
                <img
                    style={{
                        width: 'calc(100% - 10px)',
                        margin: '5px',
                    }}
                    src={ReferenceExampleGif}
                    alt={'Reference Example'}
                />
            </div>
        </div>,
        target: '',
        placement: 'right',
        disableBeacon: true,
        hideCloseButton: true,
        hideFooter: true,
    }
]


export const EnhancementSteps: Step[] = [
    {
        title: 'Enhancement',
        content: <div>
            <span>
                The Enhancement section allows you to transform referenced data before assigning it to the target field.
You can write custom logic using JavaScript, Python 3, or Ruby to modify, combine, or validate values dynamically.
                <br/>
                All referenced values are automatically exposed as variables:

            <ul style={{marginLeft: '20px'}}>
                <li>
                    RESULT_VAR — represents the final value that will be assigned to the field
                </li>
                <li>
                    VAR_0, VAR_1, … — represent referenced values from previous methods or hooks
                </li>
            </ul>
            Each variable corresponds to a specific reference shown above the editor.
            </span>
        </div>
,
target: '',
placement: 'right',
        disableBeacon: true,
        hideCloseButton: true,
        hideFooter: true,
    }
]
