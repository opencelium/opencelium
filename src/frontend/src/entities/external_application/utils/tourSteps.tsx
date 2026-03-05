import React from 'react';
import {Step} from "react-joyride";

export const ExternalApplicationListSteps: Step[] = [
    {
        title: 'External Applications',
        content:
            <span>
            This section displays the status and health of external services integrated with OpenCelium.
        </span>
        ,
        target: '#external-application-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
]
