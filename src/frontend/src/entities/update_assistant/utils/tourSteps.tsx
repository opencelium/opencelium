import {Step} from "react-joyride";
import React from "react";

export const UpdateAssistantSteps: Step[] = [
    {
        title: 'System Check',
        content:
            <span>
                This section displays basic system information and environment details.
            </span>,
        target: '#update-assistant-system-check',
        placement: 'right',
        disableBeacon: true,
    },
    {
        title: 'Available Updates',
        content:
            <span>
                This section allows you to check for new versions of OpenCelium. Two update modes are available:
                <ul style={{marginLeft: '20px'}}>
                    <li>
                        Online - the system checks for updates via internet connection.
                    </li>
                    <li>
                        Offline - used in environments without internet access.
                    </li>
                </ul>
            </span>,
        target: '#update-assistant-available-updates',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Update Process',
        content:
            <span>
                This section handles the actual update execution. Update OC button starts the update process.
            </span>,
        target: '#update-assistant-update-process',
        placement: 'right',
        disableBeacon: true,
    },
]
