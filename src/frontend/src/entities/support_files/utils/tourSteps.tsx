import React from 'react';
import {Step} from "react-joyride";
import {Link} from "react-router-dom";
import {Spot} from "@entity/schedule/utils/tourSteps";

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
            'Type here to search for a support file by connection\'s title.',
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
                <ul style={{marginLeft: 20, marginTop: 10}}>
                    <li style={{ listStyleType: 'none' }}>
                        <Spot color={'#c3f5c3'}/> Green — Generation successful
                    </li>
                    <li style={{ listStyleType: 'none' }}>
                        <Spot color={'#f5c3c3'}/> Red — Generation failed
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
            <p>
                <p>Permanently remove the support file from the system.</p><p><strong>This action
                cannot be undone!</strong></p>
            </p>,
        target: '[id^="delete_entity_"]',
        placement: 'left',
        disableBeacon: true,
    },
]
