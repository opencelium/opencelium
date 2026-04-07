import {Step} from "react-joyride";
import React from "react";
import {Link} from "react-router-dom";

export const AggregatorEmptyListSteps: Step[] = [
    {
        title: 'Data Aggregator',
        content:<div>
            <p>
                A Data Aggregator is a feature that enables structured notification handling after a Connection is triggered in a Schedule.
            <p>
                When a Schedule executes a Connection, the Aggregator processes the execution data and prepares it for notification delivery (e.g., via <Link target={'_blank'} to={'/notification_templates'}>Notification Templates</Link>).</p>
            </p>
            <p>See <a target={'_blank'} href={'https://docs.opencelium.io/en/prod/management/aggregator.html'}>docs</a> for more information.</p>
        </div>
        ,
        target: '#aggregator-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Aggregator',
        content:
            'Press Add Aggregator to create a new data aggregator.',
        target: '#data-aggregator-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
]

export const AggregatorListSteps: Step[] = [
    {
        title: 'Data Aggregator',
        content:<div>
            <p>
                A Data Aggregator is a feature that enables structured notification handling after a Connection is triggered in a Schedule.
                <p>
                    When a Schedule executes a Connection, the Aggregator processes the execution data and prepares it for notification delivery (e.g., via <Link target={'_blank'} to={'/notification_templates'}>Notification Templates</Link>).</p>
            </p>
        </div>
        ,
        target: '#aggregator-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Add Aggregator',
        content:
            'Press Add Aggregator to create a new data aggregator.',
        target: '#data-aggregator-list-add',
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
        title: 'Archived',
        content:
        <div>
            <p>Archiving helps maintain clean configuration management without breaking existing dependencies.</p>
            <p>Toggle switcher to show or to hide the archived aggregators.</p>
        </div>,
        target: '#data-aggregator-list-archived-filter',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Sort',
        content:
            'Click the column header to sort aggregators by name in ascending or descending order.',
        target: '#sort_button_name',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Sort',
        content:
            'Click the column header to sort aggregators by archived status in ascending or descending order.',
        target: '#sort_button_active',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Update',
        content:
            'Update the data aggregator general data and code.',
        target: '[id^="update_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'View',
        content:
            'Open the data aggregator in read-only mode to review its details.',
        target: '[id^="view_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]
export const AggregatorFormTourSteps: Step[] = [
    {
        title: 'General Data',
        content:
            <div>
                <p>
                    This section defines the metadata and output structure of the aggregator.
                    <p>Arguments define the output variables that will be available inside the Notification Template. Each argument consists of:
                        <br/>
                    Name – The variable identifier
                    Description – A short explanation of its purpose
                    </p>
                    <p>
                        <strong>Important</strong>:
                        <p>
                            Arguments are used inside the notification itself.
                            You must assign values to these arguments inside the Script section.
                        </p>
                    </p>

                </p>
            </div>,
        target: '#aggregator-form-general-data',
        placement: 'right',
        disableBeacon: true,
    },
    {
        title: 'Code',
        content:
            <div>
                <p>
                    This section contains the logic of the Data Aggregator. The script is responsible for:
                    <br/>
                    <p>
                        <ul style={{marginLeft: '20px'}}>
                            <li>
                                Processing connection responses
                            </li>
                            <li>
                                Aggregating results
                            </li>
                            <li>
                                Assigning values to defined arguments
                            </li>
                        </ul>
                    </p>
                </p>
            </div>,
        target: '#aggregator-form-code',
        placement: 'left',
        disableBeacon: true,
    },
]
