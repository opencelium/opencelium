import {Step} from "react-joyride";

export const ProfileTourSteps: Step[] = [
    {
        title: 'User Details',
        content:
            'The User Details section contains personal and organizational information associated with the account, including contact details and role-related metadata.',
        target: '#profile-form-user-details',
        placement: 'right',
        disableBeacon: true,
    },
    {
        title: 'Settings',
        content:
            'The Settings section allows you to configure user-specific preferences, such as the visual theme used across the interface.',
        target: '#profile-form-settings',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Permissions',
        content:
            'The Permissions section defines access rights for the user, specifying allowed actions (Create, Read, Update, Delete) for each system entity.',
        target: '#profile-form-permissions',
        placement: 'left',
        disableBeacon: true,
    },
]
