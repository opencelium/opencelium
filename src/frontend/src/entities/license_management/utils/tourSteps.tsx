import {Step} from "react-joyride";
import React from "react";

const LicenseManagementCommonSteps: Step[] = [
    {
        title: 'Subscription',
        content:
            <span>
                This section displays information about your current license and API limits.
                <br/>
                <br/>
                <ul style={{marginLeft: '20px'}}>
                    <li>Status – Indicates whether the license is valid.</li>
                    <li>Type – License type (e.g., Free, Starter, Enterprise).</li>
                    <li>Amount of API Operations – The maximum number of API calls allowed per monthly period.</li>
                    <li>Expiration Date – License expiration date (if applicable).</li>
                    <li>Monthly Period – Current billing/usage period.</li>
                </ul>
            </span>,
        target: '#license-management-subscription',
        placement: 'right',
        disableBeacon: true,
    },
    {
        title: 'Progress Bar',
        content:
            <span>
                The progress bar visualizes current API consumption for the active monthly period.
            </span>,
        target: '#license-management-progress-bar',
        placement: 'right',
        disableBeacon: true,
    },
    {
        title: 'Detail View',
        content:
            <span>
                This section shows detailed API usage statistics grouped by Connection.
                It allows you to identify which connections consume the most API operations.
                When you click on a specific Connection, a detailed view opens.
            </span>,
        target: '#license-management-detail-view',
        placement: 'left',
        disableBeacon: true,
    },
]

export const LicenseManagementSteps: Step[] = [
    {
        title: 'Subscription Overview',
        content:
            <span>
                This page provides an overview of your current subscription and API usage statistics.
It helps monitor API consumption and track usage per Connection.
            </span>,
        target: '#license-management-header',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Activate License',
        content:
            <div>
                <p>
                    Activate your license using synchronisation with Service Portal (SP).
                </p>
                <p>
                    In order to do that, your application.yml file should contain configurations to connect with SP.
                </p>
                <p>See <a target={'_blank'}
                          href={'https://docs.opencelium.io/en/prod/management/license_management.html'}>docs</a> for more
                    information.</p>
            </div>,
        target: '#license-management-activate-license',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Generate Activation Request',
        content:
            <span>
                Creates a license activation request file for offline environments.
                <br/>
                <br/>
                How it works:
                <ul style={{marginLeft: 20}}>
                    <li>
                        Generates a request file based on the current system instance.
                    </li>
                    <li>The file must be uploaded to the Service Portal.</li>
                    <li>The portal generates a valid license file in response.</li>
                    <li>The received license file can then be imported into the system.</li>
                </ul>
            </span>,
        target: '#license-management-generate-act-req',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Import License',
        content:
            <span>
                Imports and activates a license file.
                <br/>
                <br/>
                How it works:
                <ul style={{marginLeft: 20}}>
                    <li>
                        Upload the license file received from the Service Portal.
                    </li>
                    <li>
                        The system validates and activates the license.
                    </li>
                    <li>
                        License details are updated immediately in the Subscription section.
                    </li>
                </ul>
            </span>,
        target: '#license-management-import-license',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Extra Ops',
        content:
            <span>
                Import additional API Operations when your subscription quota is exhausted.
                <br/>
                <br/>
                How it works:
                <ul style={{marginLeft: 20}}>
                    <li>
                        Extends the available API quota for the current subscription period.
                    </li>
                    <li>
                        Does not replace the main license — it adds additional operation capacity.
                    </li>
                </ul>
            </span>,
        target: '#license-management-extra-ops',
        placement: 'bottom',
        disableBeacon: true,
    },
    {
        title: 'Activate Free License',
        content:
            <span>
                You can activate a free license pressing on this button. It will provide you 25K API requests.
            </span>,
        target: '#license-management-activate-free',
        placement: 'bottom',
        disableBeacon: true,
    },
    ...LicenseManagementCommonSteps,
]
