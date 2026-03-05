import React from 'react';
import {Step} from "react-joyride";
import {Link} from "react-router-dom";

export const SupportFileEmptyListSteps: Step[] = [
    {
        title: 'Support File',
        content:
        <span>
            This section contains generated support files created from <Link to={'/schedules'}>Schedules</Link>. Files include masked request and response data for diagnostic purposes.
        </span>
        ,
        target: '#support-file-list-empty-header',
        placement: 'bottom',
        disableBeacon: true,
    },
]
export const SupportFileListSteps: Step[] = [
    {
        title: 'Support File',
        content:
            `This section contains generated support files created from Schedules. Files include masked request and response data for diagnostic purposes.`,
        target: '#support-file-list-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Delete support files',
        content:
            'Select support files that you want to delete and press here to do an action.',
        target: '#support-file-list-delete-selected',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Search',
        content:
            'Type here to search for a group by connection\'s title.',
        target: '#collection-search-input',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Connection',
        content:
            'Title of the connection for which the support file was generated.',
        target: '#collection-column-header-connection',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'File Path"',
        content:
            'The system path where the generated support file is stored.',
        target: '#collection-column-header-supportFile',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Timestamp',
        content:
            'Date and time when the support file was generated."',
        target: '#collection-column-header-timestamp',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Generation Status',
        content:
            <span>
                Indicates whether the support file generation was successful or failed.
                <ul style={{marginLeft: 20}}>
                    <li style={{ listStyleType: 'none' }}>
                        🟢 Green — Generation successful
                    </li>
                    <li style={{ listStyleType: 'none' }}>
                        🔴 Red — Generation failed
                    </li>
                </ul>

            </span>,
        target: '#collection-column-header-status',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Download',
        content:
            'Download support file on your local storage.',
        target: '[id^="download_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
    {
        title: 'Delete',
        content:
            'Permanently remove the support file from the system. This action cannot be undone.',
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]
