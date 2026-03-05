import React from 'react';
import {Step} from "react-joyride";

export const LDAPWithoutDebugTourSteps: Step[] = [
    {
        title: 'LDAP Test',
        content:
            <span>
                This section allows you to review the current LDAP configuration and test the connection to the LDAP server.
                Click to test the LDAP connection using the current configuration.
                <br/>
                All fields are read-only and loaded from the application.yml configuration file.
                <br/>
                If the configuration is incorrect, please contact your system administrator to update the LDAP settings.
            </span>,
        target: '#ldap-form-config',
        placement: 'right',
        disableBeacon: true,
    },
]

export const LDAPWithDebugTourSteps: Step[] = [
    ...LDAPWithoutDebugTourSteps,
    {
        title: 'LDAP Test Logs',
        content:
            <span>
                Displays detailed logs of the LDAP connection test, including connection attempts, authentication results, and potential errors.
            </span>,
        target: '#ldap-form-debug',
        placement: 'left',
        disableBeacon: true,
    },
]
