import {Step} from "react-joyride";

export const WidgetTourSteps: Step[] = [
    {
        title: 'Connection Overview',
        content:
            'The Connection Overview widget visualizes relationships between connectors based on existing integrations.',
        target: '#widget-CONNECTION_OVERVIEW',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Current Schedules',
        content:
            'The Current Schedules widget displays all configured schedules, including those that are currently being executed.',
        target: '#widget-CURRENT_SCHEDULER',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Subscription Overview',
        content:
            'The Subscription Overview widget provides details about your active license, including plan type and usage limits.',
        target: '#widget-SUBSCRIPTION_OVERVIEW',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Metrics Overview',
        content:
            'The Metrics Overview widget presents system performance metrics and operational statistics of OpenCelium.',
        target: '#widget-METRICS_OVERVIEW',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Save Dashboard',
        content:
            'Save widget settings clicking on the check icon.',
        target: '#dashboard-edit-icon',
        placement: 'bottom',
    },
]

export const DashboardTourSteps: Step[] = [
    {
        title: 'Toggle Menu',
        content:
            `Toggle menu expansion mode. When enabled, the menu remains expanded at all times.
When disabled, the menu expands only on mouse hover.`,
        target: '#menu_burger_icon',
        placement: 'right',
        disableBeacon: true,
        spotlightPadding: 0,
    },
    {
        title: 'Connectors',
        content:
            'Connectors are core components of OpenCelium. They represent external or internal systems used to send requests and receive responses.',
        target: '#connector_menu_item',
        placement: 'right',
        disableBeacon: true,
        spotlightPadding: 0,
    },
    {
        title: 'Connections',
        content:
            'Connections define how connectors interact with each other, including request flow, data mapping, and communication logic.',
        target: '#connection_menu_item',
        placement: 'right',
        spotlightPadding: 0,
    },
    {
        title: 'Schedules',
        content:
            'Schedules determine when specific connections are executed, either on a defined timetable or based on triggers.',
        target: '#schedule_menu_item',
        placement: 'right',
        spotlightPadding: 0,
    },
    {
        title: 'Admin Panel',
        content:
            'The Admin Panel provides administrative and system-level tools for managing and configuring OpenCelium.',
        target: '#admin_menu_item',
        placement: 'right',
        spotlightPadding: 0,
    },
    {
        title: 'Log Out',
        content:
            'Sign out of your account and end the current session.',
        target: '#logout_menu_item',
        placement: 'top-end',
        spotlightPadding: 0,
    },
    {
        title: 'Edit Dashboard',
        content:
            'Customize your dashboard by adding, removing, or rearranging widgets to match your workflow.',
        target: '#dashboard-edit-icon',
        placement: 'bottom',
    },
    {
        title: 'Search',
        content:
            'Use global search to quickly find connectors, connections, or schedules by name.',
        target: '#global-search',
        placement: 'bottom',
    },
    {
        title: 'Notification History',
        content:
            'Access your notification history to review system events and important updates.',
        target: '#button_notifications',
        placement: 'bottom',
    },
    {
        title: 'Profile',
        content:
            'Open your profile to view and manage personal details and account settings.',
        target: '#my_profile',
        placement: 'bottom',
    },
];
