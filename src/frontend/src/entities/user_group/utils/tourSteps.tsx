import {Step} from "react-joyride";

const UserGroupCommonListSteps: Step[] = [
    {
        title: 'Add Group',
        content:
            'Press Add Group to create a new group.',
        target: '#group-list-add',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Delete Groups',
        content:
            'Select groups that you want to delete and press here to do an action.',
        target: '#group-list-delete-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Search',
        content:
            'Type here to search for a group by name, description, and permission.',
        target: '#collection-search-input',
        placement: 'bottom',
        disableBeacon: true,
    },
]
export const UserGroupEmptyListSteps: Step[] = [
    {
        title: 'Group',
        content:
            'Groups define roles and permission levels within the system. Each group controls what users are allowed to create, view, update, or delete.',
        target: '#group-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    ...UserGroupCommonListSteps,
];
export const UserGroupListSteps: Step[] = [
    {
        title: 'User Group',
        content:
            'Groups define roles and permission levels within the system. Each group controls what users are allowed to create, view, update, or delete.',
        target: '#group-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    ...UserGroupCommonListSteps,
    {
        title: 'Sort',
        content:
            'Click the column header to sort groups by name in ascending or descending order.',
        target: '#sort_button_name',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'View',
        content:
            'Open the group in read-only mode to review its configuration and details.',
        target: '[id^="view_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
];


export const UserGroupFormWithoutPermissionTourSteps: Step[] = [
    {
        title: 'Group Details',
        content:
            'Basic information that defines the role identity.',
        target: '#group-form-details',
        placement: 'right',
        disableBeacon: true,
    },
    {
        title: 'Components',
        content:
            'Select the system modules that this group will have access to.',
        target: '#group-form-components',
        placement: 'left',
        disableBeacon: true,
    },
]


export const UserGroupFormWithPermissionTourSteps: Step[] = [
    ...UserGroupFormWithoutPermissionTourSteps,
    {
        title: 'Permissions',
        content:
            'Define detailed access rights (CRUD + Admin) for each selected component.',
        target: '#group-form-permissions',
        placement: 'left',
        disableBeacon: true,
    },
]
