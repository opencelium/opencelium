import React from 'react'
import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import { i18n } from '@shared/i18n/config/i18n'
import en from '@entities/systemCheck/i18n/en.json'
import de from '@entities/systemCheck/i18n/de.json'
import type { HealthStatus, SystemHealth } from '@entities/updateAssistant/model/types'

const baseKey = 'system-check'

export const SYSTEM_CHECK_SERVICES = [
    'mariaDB',
    'mongoDB',
    'opencelium',
    'os',
    'email',
    'polyglot',
] as const

export type SystemCheckService = (typeof SYSTEM_CHECK_SERVICES)[number]

const INFO_DETAIL_KEY: Record<SystemCheckService, string> = {
    email: 'location',
    mariaDB: 'version',
    mongoDB: 'version',
    opencelium: 'version',
    os: 'name',
    polyglot: 'name',
}

const MISSING = '-'

const STATUS_PRIORITY: Record<HealthStatus, number> = {
    UP: 0,
    UNKNOWN: 1,
    DOWN: 2,
}

type ServiceRow = {
    key: SystemCheckService
    status: HealthStatus
    info: string
    error: string
}

const STATUS_DOT: Record<HealthStatus, string> = {
    UP: 'var(--color-status-success-fg)',
    DOWN: 'var(--color-status-error-fg)',
    UNKNOWN: 'var(--color-status-warning-fg)',
}

const StatusCell: React.FC<{ status: HealthStatus }> = ({ status }) => {
    const t = i18n.getFixedT(i18n.language, 'entities')
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: STATUS_DOT[status],
                    display: 'inline-block',
                    flexShrink: 0,
                }}
            />
            {t(`${baseKey}.list.status.${status}` as any)}
        </span>
    )
}

export const systemCheckDefinition: EntityDefinition = {
    name: baseKey,

    routes: [{ type: 'list' }],

    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        emptyKey: `${baseKey}.list.empty`,
        fetchUrl: '/actuator/health',
        mapToRows: (raw): ServiceRow[] => {
            const components = ((raw as SystemHealth | undefined)?.components ?? {}) as Record<
                string,
                { status?: HealthStatus; details?: Record<string, unknown> }
            >
            const t = i18n.getFixedT(i18n.language, 'entities')
            const rows = SYSTEM_CHECK_SERVICES.map((k): ServiceRow => {
                const details = components[k]?.details
                const infoVal = details?.[INFO_DETAIL_KEY[k]]
                const errorVal = details?.error
                return {
                    key: k,
                    status: components[k]?.status ?? 'UNKNOWN',
                    info: typeof infoVal === 'string' && infoVal.length > 0 ? infoVal : MISSING,
                    error: typeof errorVal === 'string' && errorVal.length > 0 ? errorVal : MISSING,
                }
            })
            return rows.sort((a, b) => {
                const sd = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
                if (sd !== 0) return sd
                const labelA = t(`${baseKey}.list.components.${a.key}` as any, { defaultValue: a.key })
                const labelB = t(`${baseKey}.list.components.${b.key}` as any, { defaultValue: b.key })
                return String(labelA).localeCompare(String(labelB))
            })
        },
        actions: [],
        searchable: false,
    },

    i18n: { en, de },

    api: { baseUrl: '/actuator', identifierField: 'key' },

    fields: [
        {
            name: 'key',
            type: 'string',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 1,
                width: 250,
                labelKey: `${baseKey}.list.columns.component`,
                mapToValue: (_row, raw) => {
                    const t = i18n.getFixedT(i18n.language, 'entities')
                    return t(`${baseKey}.list.components.${raw}` as any, {
                        defaultValue: String(raw ?? ''),
                    })
                },
            },
        },
        {
            name: 'status',
            type: 'string',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 2,
                labelKey: `${baseKey}.list.columns.status`,
                render: (_row, value) => <StatusCell status={value as HealthStatus} />,
            },
        },
        {
            name: 'info',
            type: 'string',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 3,
                labelKey: `${baseKey}.list.columns.info`,
            },
        },
        {
            name: 'error',
            type: 'string',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 4,
                labelKey: `${baseKey}.list.columns.error`,
            },
        },
    ],

    sections: [],

    wizard: { steps: [] },
}
