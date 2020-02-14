/*
 * Copyright (C) <2020>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
import React from 'react';
import SwitchOffTour from "./SwitchOffTour";

export const OC_TOURS = [
    {
        selector: '.tour-step-intro',
        content:
            <SwitchOffTour>
                OpenCelium welcomes you! Open Source API-HUB. Go throw the tour to get know its opportunities.
            </SwitchOffTour>},
    {
        selector: '.tour-step-myprofile',
        content: 'To change auto tour or theme click on Profile Icon',},
    {
        selector: '.tour-step-dashboard',
        content: 'Dashboard provide you monitoring features',},
    {
        selector: '.tour-step-user',
        content: 'Here you can manage users',},
    {
        selector: '.tour-step-usergroup',
        content: 'To work with user groups please go here',},
    {
        selector: '.tour-step-connector',
        content: 'Connectors provide you a manipulation with invokers',},
    {
        selector: '.tour-step-connection',
        content: 'Here you can directly work with connections',},
    {
        selector: '.tour-step-schedule',
        content: 'Gives you opportunity to schedule your connections',},
    {
        selector: '.tour-step-admin_cards',
        content: 'Here you find more opportunities, like apps and invokers',},
    {
        selector: '.tour-step-logout',
        content: 'Here you can logout from OC',
    },
];

export const USERGROUP_TOURS = {
    page_1: [
        {
            selector: '.tour-page-1-step-1',
            content:
                <SwitchOffTour>
                    Provide unique name
                </SwitchOffTour>,},
        {
            selector: '.tour-page-1-step-2',
            content: 'Provide description (optional)',
        },
        {
            selector: '.tour-page-1-step-3',
            content: 'Choose icon (optional)',
        },
    ],
    page_2: [
        {
            selector: '.tour-page-2-step-1',
            content:
                <SwitchOffTour>
                    Select components
                </SwitchOffTour>,
        },
    ],
    page_3: [
        {
            selector: '.tour-page-3-step-1',
            content:
                <SwitchOffTour>
                    Select permissions to each component
                </SwitchOffTour>,
        },
    ],
};

export const USER_TOURS = {
    page_1: [
        {
            selector: '.tour-page-1-step-1',
            content:
                <SwitchOffTour>
                    Provide unique valid email
                </SwitchOffTour>,},
        {
            selector: '.tour-page-1-step-2',
            content: 'Provide password with minimum 8 length characters',
        },
        {
            selector: '.tour-page-1-step-3',
            content: 'Repeat password ',
        },
    ],
    page_2: [
        {
            selector: '.tour-page-2-step-1',
            content:
                <SwitchOffTour>
                    Prodive name of user
                </SwitchOffTour>,
        },
        {
            selector: '.tour-page-2-step-2',
            content: 'Provide surname of user',
        },
    ],
    page_3: [
        {
            selector: '.tour-page-3-step-1',
            content:
                <SwitchOffTour>
                    Assign user to usergroup
                </SwitchOffTour>,
        },

    ],
};

export const CONNECTION_ADD_TOURS = {
    page_1: [
        {
            selector: '.page-1-first-tour-step',
            content:
                <SwitchOffTour>
                    Give a name to the connection
                </SwitchOffTour>,},
        {
            selector: '.page-1-second-tour-step',
            content: 'Here you choose connectors from where your data should be gathered and where they should be used',
        },
    ],
    page_2: [
        {
            selector: '.page-2-first-tour-step',
            content:
                <SwitchOffTour>
                    Choose if you want to use a template or start from zero
                </SwitchOffTour>,
        }
    ],
    page_3: [
        {
            selector: '.page-3-first-tour-step',
            content:
                <SwitchOffTour>
                    This is a method panel
                </SwitchOffTour>,},
        {
            selector: '.page-3-second-tour-step',
            content: 'This is a field panel',
        },
    ],
};

export const CONNECTION_UPDATE_TOURS = {
    page_1: [
        {
            selector: '.page-1-first-tour-step',
            content:
                <SwitchOffTour>
                    Give a name to the connection
                </SwitchOffTour>,},
        {
            selector: '.page-1-second-tour-step',
            content: 'Here you choose connectors from where your data should be gathered and where they should be used',
        },
    ],
    page_2: [
        {
            selector: '.page-3-first-tour-step',
            content:
                <SwitchOffTour>
                    This is a method panel
                </SwitchOffTour>,},
        {
            selector: '.page-3-second-tour-step',
            content: 'This is a field panel',
        },
    ],
};

export const CONNECTOR_TOURS = {
    page_1: [
        {
            selector: '.tour-page-1-step-1',
            content:
                <SwitchOffTour>
                    Provide name for the connector.
                </SwitchOffTour>,
        },
        {
            selector: '.tour-page-1-step-2',
            content: 'Provide description for the connector, if you need',
        },
        {
            selector: '.tour-page-1-step-3',
            content: 'Set invoker for the connector',
        },
    ],
    page_2: [
        {
            selector: '.tour-page-2-step-1',
            content:
                <SwitchOffTour>
                    Please, enter a url to make a request
                </SwitchOffTour>,
            key: 'url',
        },
        {
            selector: '.tour-page-2-step-2',
            content: 'Please, enter an api key to get an access',
            key: 'apikey',
        },
        {
            selector: '.tour-page-2-step-3',
            content: 'Please, enter a username to get an access',
            key: 'username',
        },
        {
            selector: '.tour-page-2-step-4',
            content: 'Please, enter a password to get an access',
            key: 'password',
        },
        {
            selector: '.tour-page-2-step-5',
            content: 'Please, enter a login to get an access',
            key: 'userlogin',
        },
        {
            selector: '.tour-page-2-step-6',
            content: 'Please, enter a webservice to get correct data',
            key: 'webservice',
        },
    ],
};

export const SCHEDULE_TOURS = [
    {
        selector: '.tour-step-1',
        content:
            <SwitchOffTour>
                Fill data and click Add Job button
            </SwitchOffTour>,
    },{
        selector: '.tour-step-2',
        content: 'Here is the whole list of created schedules',
    },{
        selector: '.tour-step-3',
        content: 'Shows the cron expression',
    },{
        selector: '.tour-step-4',
        content: 'Shows the time of last successful triggering',
    },{
        selector: '.tour-step-5',
        content: 'Shows the time of last failed triggering',
    },{
        selector: '.tour-step-6',
        content: 'Shows the duration time of last triggering',
    },{
        selector: '.tour-step-7',
        content: 'Shows the status of the schedule. Red - last triggering was failed. Green - last triggering was successful. Grey - not triggered.',
    },{
        selector: '.tour-step-8',
        content: 'Clicking on cron, you will see the cron expression',
    },
];

export const APP_TOURS = [
    {
        selector: '.tour-step-card-1',
        content:
            <SwitchOffTour>
                Click on the card to open an application
            </SwitchOffTour>,
    },
];

export const INVOKER_TOURS = {
    page_1: [
        {
            selector: '.tour-page-1-step-1',
            content:
                <SwitchOffTour>
                    Provide name for the invoker
                </SwitchOffTour>,
        },
        {
            selector: '.tour-page-1-step-2',
            content: 'Provide description for the invoker (optional)',
        },
        {
            selector: '.tour-page-1-step-3',
            content: 'Provide hint to display more information (optional)',
        },
        {
            selector: '.tour-page-1-step-4',
            content: 'Provide icon (optional)',
        },
    ],
    page_2: [
        {
            selector: '.tour-page-2-step-1',
            content:
                <SwitchOffTour>
                    Please, provide authentication for requests
                </SwitchOffTour>,
        },
    ],
    page_3: [
        {
            selector: '.tour-page-3-step-1',
            content:
                <SwitchOffTour>
                    Please, provide name of the method to test request
                </SwitchOffTour>,
        },
        {
            selector: '.tour-page-3-step-2',
            content: 'Please, provide path to the request',
        },
        {
            selector: '.tour-page-3-step-3',
            content: 'Please, choose method of the request',
        },
        {
            selector: '.tour-page-3-step-4',
            content: 'Please, provide header and body to make request, to receive success and fail results',
        },
        {
            selector: '.tour-page-3-step-5',
            content: 'Here you can read information about the chosen key in details',
        },
        {
            selector: '.tour-page-3-step-6',
            content: 'Instead of adding items separately, you can type or paste json clicking here',
        },
    ],
    page_4: [
        {
            selector: '.tour-page-4-step-1',
            content:
                <SwitchOffTour>
                    Please, provide name of the method to test request
                </SwitchOffTour>,
        },
        {
            selector: '.tour-page-4-step-2',
            content: 'Please, provide path to the request',
        },
        {
            selector: '.tour-page-4-step-3',
            content: 'Please, choose method of the request',
        },
        {
            selector: '.tour-page-4-step-4',
            content: 'Please, provide header and body to make request, to receive success and fail results',
        },
        {
            selector: '.tour-page-4-step-5',
            content: 'Here you can read information about the chosen key in details',
        },
        {
            selector: '.tour-page-4-step-6',
            content: 'Instead of adding items separately, you can type or paste json clicking here',
        },
        {
            selector: '.tour-page-4-step-7',
            content: 'Click on the plus to add a new operation',
        },
    ],
};

export const ADMINCARD_TOURS = [
    {
        selector: '.tour-step-card-1',
        content:
            <SwitchOffTour>
                Click on the card to open it
            </SwitchOffTour>,
    },
];


export const LIST_TOURS = {
    card_1_user : [
        {
            selector: '.tour-step-card-1',
            content:
                <SwitchOffTour>
                    Press key 1 to select a card
                </SwitchOffTour>,
        },{
            selector: '.tour-step-view-1',
            content: 'After you can press V to view the card',
        },{
            selector: '.tour-step-update-1',
            content: 'Press U to update the card',
        },{
            selector: '.tour-step-delete-add',
            content: 'Click on the button or press Alt + a to add a new element',
        },
    ],
    card_1 : [
        {
            selector: '.tour-step-card-1',
            content:
                <SwitchOffTour>
                    Press key 1 to select a card
                </SwitchOffTour>,
        },{
            selector: '.tour-step-view-1',
            content: 'After you can press V to view the card',
        },{
            selector: '.tour-step-update-1',
            content: 'Press U to update the card',
        },{
            selector: '.tour-step-delete-1',
            content: 'Press D to delete the card',
        },{
            selector: '.tour-step-delete-add',
            content: 'Click on the button or press Alt + a to add a new element',
        },
    ],
    card_2: [
        {
            selector: '.tour-step-card-2',
            content:
                <SwitchOffTour>
                    Press key 2 to select a card
                </SwitchOffTour>,
        },{
            selector: '.tour-step-view-2',
            content: 'After you can press V to view the card',
        },{
            selector: '.tour-step-update-2',
            content: 'Press U to update the card',
        },{
            selector: '.tour-step-delete-2',
            content: 'Press D to delete the card',
        },{
            selector: '.tour-step-delete-add',
            content: 'Click on the button or press Alt + a to add a new element',
        },
    ]
};


export function automaticallyShowTour(authUser){
    if(authUser && authUser.userDetail.hasOwnProperty('appTour')){
        return authUser.userDetail.appTour;
    }
    return true;
}