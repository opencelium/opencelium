import {Step} from "react-joyride";
import React from "react";

const UserCommonListSteps: Step[] = [
    {
        title: 'Add User',
        content:
            'Press Add User to create a new user.',
        target: '#user-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Enable 2FA',
        content:
            'Select users that you want to enable two-factor authentication.',
        target: '#user-list-enable-2fa-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Delete Users',
        content:
            'Select users that you want to delete and press here to do an action.',
        target: '#user-list-delete-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Search',
        content:
            'Type here to search for a user by email and group.',
        target: '#collection-search-input',
        placement: 'bottom',
        disableBeacon: true,
    },
]
export const UserEmptyListSteps: Step[] = [
    {
        title: 'User',
        content:
            'This section allows administrators to manage system users, assign groups, enable two-factor authentication (2FA), and control access permissions.',
        target: '#user-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    ...UserCommonListSteps,
];
export const UserListSteps: Step[] = [
    {
        title: 'User',
        content:
            'This section allows administrators to manage system users, assign groups, enable two-factor authentication (2FA), and control access permissions.',
        target: '#user-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    ...UserCommonListSteps,
    {
        title: 'Sort',
        content:
            'Click the column header to sort users by email in ascending or descending order.',
        target: '#sort_button_email',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'View',
        content:
            'Open the user in read-only mode to review its configuration and details.',
        target: '[id^="view_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Update',
        content:
            'Update the user details, credentials and group.',
        target: '[id^="update_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Delete',
        content:
            <p>
                <p>Permanently remove the user from the system.</p><p><strong>This action
                cannot be undone!</strong></p>
            </p>,
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
];


export const UserFormTourSteps: Step[] = [
    {
        title: 'User Details',
        content:
            'Basic personal information of the user. These fields define the user profile within the system.',
        target: '#user-form-details',
        placement: 'right',
        disableBeacon: true,
    },
    {
        title: 'Settings',
        content:
            'Login credentials used to access the system. The email serves as the username.',
        target: '#user-form-credentials',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Permissions',
        content:
            'Defines the permission level and access rights of the user within the system.',
        target: '#user-form-group',
        placement: 'left',
        disableBeacon: true,
    },
]
