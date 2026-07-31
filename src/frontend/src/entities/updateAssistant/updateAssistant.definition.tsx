import React from 'react'
import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import assistantWizardImage from '@assets/images/wizard/update-assistant-wizard.gif'
import en from '@entities/updateAssistant/i18n/en.json'
import de from '@entities/updateAssistant/i18n/de.json'
import { resolveUpdateAssistantNames } from '@entities/updateAssistant/command/resolvers/resolveUpdateAssistantNames'
import { UpdateAssistantPage } from '@pages/UpdateAssistantPage/UpdateAssistantPage'
import {
    REQUIRED_COMPONENTS
} from "@shared/ui/wizard-step/editor/update-assistant-health-viewer/UpdateAssistantHealthViewer.tsx";
import { UpdateAssistantSuccessContent } from "@shared/ui/wizard-step/editor/update-assistant-run-button/UpdateAssistantSuccessContent.tsx";

const baseKey = 'update-assistant'

export const updateAssistantDefinition: EntityDefinition = {
    name: baseKey,

    routes: [
        { type: 'view', path: `/${baseKey}`, element: <UpdateAssistantPage /> },
    ],

    i18n: { en, de },

    api: {
        baseUrl: '/assistant/oc',
        identifierField: 'id',
        resolveIdentifier: resolveUpdateAssistantNames,

        actions: {
            getHealth: {
                url: '/actuator/health',
                method: 'GET',
            },
            getOnlineVersions: {
                url: '/assistant/oc/online/version/all',
                method: 'GET',
            },
            getOfflineVersions: {
                url: '/assistant/oc/offline/version/all',
                method: 'GET',
            },
            uploadOffline: {
                url: '/assistant/zipfile',
                method: 'POST',
            },
        },
    },

    /* ===============================
       FIELDS
    ================================ */

    fields: [
        // ── Step 1: System Check ──────────────────────────────────────
        {
            name: 'systemHealth',
            label: `${baseKey}.fields.systemHealth.label`,
            type: 'other',
            defaultValue: null,
            ui: {
                component: 'input',
                overrideKey: 'updateAssistantHealthViewer',
            },
            validation: {
                custom: [
                    {
                        validate: (value: any) => {
                            if (!value?.components) return true
                            return REQUIRED_COMPONENTS.every((k) => value.components[k]?.status === 'UP')
                        },
                        message: `${baseKey}.validation.requiredComponentsDown`,
                    },
                ],
            },
        },

        // ── Step 2: Available Updates ─────────────────────────────────
        {
            name: 'updateMode',
            type: 'enum',
            interactive: true,
            ui: {
                component: 'select',
                props: {
                    labelKey: `${baseKey}.fields.updateMode.label`,
                    options: [
                        { value: 'online', label: 'Online' },
                        { value: 'offline', label: 'Offline' },
                    ],
                },
            },
            defaultValue: 'online',
        },
        {
            name: 'versionsDisplay',
            label: `${baseKey}.fields.versionsDisplay.label`,
            type: 'other',
            interactive: true,
            defaultValue: null,
            ui: {
                component: 'input',
                overrideKey: 'updateAssistantVersionsTable',
            },
            validation: {
                required: true,
                custom: [
                    {
                        validate: (value: unknown) =>
                            typeof value === 'string' && value.length > 0,
                        message: `${baseKey}.validation.versionNotSelected`,
                    },
                ],
            },
        },

        // ── Step 3: Update Process ────────────────────────────────────
        {
            name: 'runUpdateAction',
            label: `${baseKey}.fields.runUpdateAction.label`,
            type: 'other',
            defaultValue: null,
            ui: {
                component: 'input',
                overrideKey: 'updateAssistantRunButton',
            },
        },
    ],

    /* ===============================
       SECTIONS
    ================================ */

    sections: [
        {
            id: 'system-check',
            fields: ['systemHealth'],
        },
        {
            id: 'available-updates',
            fields: ['updateMode', 'versionsDisplay'],
        },
        {
            id: 'update-process',
            fields: ['runUpdateAction'],
        },
    ],

    /* ===============================
       WIZARD
    ================================ */

    wizard: {
        image: assistantWizardImage as string,
        modes: {
            view: {
                header: `${baseKey}.wizard.modes.view.header`,
                subheader: `${baseKey}.wizard.modes.view.subheader`,
            },
            create: {
                successMessage: `${baseKey}.update.successTitle`,
                getSuccessContent: (formData: { versionsDisplay?: unknown }) => (
                    <UpdateAssistantSuccessContent
                        version={typeof formData?.versionsDisplay === 'string' ? formData.versionsDisplay : undefined}
                    />
                ),
            },
        },

        steps: [
            {
                id: 'system-check',
                header: `${baseKey}.wizard.steps.system-check.header`,
                subheader: `${baseKey}.wizard.steps.system-check.subheader`,
                sectionIds: ['system-check'],
                validateFields: ['systemHealth'],
            },
            {
                id: 'available-updates',
                header: `${baseKey}.wizard.steps.available-updates.header`,
                subheader: `${baseKey}.wizard.steps.available-updates.subheader`,
                sectionIds: ['available-updates'],
                validateFields: ['updateMode', 'versionsDisplay'],
            },
            {
                id: 'update-process',
                header: `${baseKey}.wizard.steps.update-process.header`,
                subheader: `${baseKey}.wizard.steps.update-process.subheader`,
                sectionIds: ['update-process'],
                actions: {
                    submitLabel: `${baseKey}.wizard.steps.update-process.actions.runUpdate`,
                },
            },
        ],
    },
}
