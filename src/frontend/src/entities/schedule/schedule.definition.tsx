import type { EntityDefinition } from '@/engine/entity/EntityDefinition'
import scheduleWizardImage from '@/assets/images/wizard/schedule.gif'
import {createEntityCommands} from "@/engine/entity/command/createEntityCommands.tsx";
import en from "@entities/schedule/i18n/en.json";
import de from "@entities/schedule/i18n/de.json";
import cron from "cron-validate";
import {resolveScheduleConnectionTitles} from "@entities/schedule/command/resolvers/resolveScheduleNames.ts";
import {store} from "@app/store/store.ts";
import {i18n} from "@shared/i18n/config/i18n.ts";
import {resolveScheduleIds} from "@entities/schedule/command/resolvers/resolveScheduleId.ts";
import {scheduleApi} from "@entities/schedule/api/scheduleApi.ts";
import {SCHEDULE_TAG} from "@entities/schedule/api/schedule.tags.ts";
import {genericApi} from "@shared/api/genericApi.ts";
import type {Schedule, ScheduleUpdateDTO} from "@entities/schedule/model/types.ts";
import {stripSeconds} from "@shared/ui/wizard-step/editor/cron-editor/cron-editor.utils.ts";
import {StatusCell} from "@entities/schedule/ui/StatusCell.tsx";
import {useCurrentSchedules} from "@entities/schedule/socket/useCurrentSchedules";
import {ConnectionTitleCell} from "@entities/schedule/ui/ConnectionTitleCell.tsx";
import {ExecutionCell} from "@entities/schedule/ui/ExecutionCell.tsx";
import {DurationCell} from "@entities/schedule/ui/DurationCell.tsx";
import {DebugModeCell} from "@entities/schedule/ui/DebugModeCell.tsx";
import {WebhookCell} from "@entities/schedule/ui/WebhookCell.tsx";
import {CronCell} from "@entities/schedule/ui/CronCell.tsx";
import {NotificationsAction} from "@entities/schedule/ui/NotificationsAction.tsx";
import {SupportLogsAction} from "@entities/schedule/ui/SupportLogsAction.tsx";
import {BulkNotificationsDialogContent} from "@entities/schedule/ui/BulkNotificationsDialogContent.tsx";

const baseKey = 'schedule';

const Dot = ({color}: {color: string}) => (
    <span
        style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: color,
            marginRight: 4,
            verticalAlign: 'middle',
        }}
    />
)

type ConnectionMeta = { id: number; title: string }

function resolveConnectionTitle(connectionId: ScheduleUpdateDTO['connectionId']): string {
    const id = Number(connectionId);
    if (!Number.isFinite(id)) return '';
    const cache = genericApi.endpoints.fetchEntities.select('/connection/all/meta')(store.getState());
    const list = cache.data as ConnectionMeta[] | undefined;
    return list?.find((c) => c.id === id)?.title ?? '';
}

function buildScheduleSuccessMessage(mode: 'create' | 'update', formData: ScheduleUpdateDTO): string {
    const t = i18n.getFixedT(i18n.language, 'entities');
    const connectionTitle = resolveConnectionTitle(formData.connectionId);
    const cronExp = formData.cronExp?.trim();
    const key = cronExp
        ? `${baseKey}.wizard.modes.${mode}.successMessageWithCron`
        : `${baseKey}.wizard.modes.${mode}.successMessage`;
    return t(key, { connectionTitle, cronExp });
}

export const scheduleDefinition: EntityDefinition = {
    name: baseKey,
    api: {
        baseUrl: '/scheduler',
        identifierField: 'id',
        primaryKey: 'schedulerId',
        resolveIdentifier: resolveScheduleConnectionTitles,
        mapToForm: ({connection, ...scheduleModel}: Schedule): ScheduleUpdateDTO => {
            return {
                ...scheduleModel,
                connectionId: connection.connectionId,
            }
        },
    },
    routes: [
        { type: 'create' },
        { type: 'view' },
        { type: 'edit' },
        { type: 'list' },
    ],
    list: {
        titleKey: `${baseKey}.list.title`,
        subtitleKey: `${baseKey}.list.subTitle`,
        subtitleComponents: {
            blueDot: <Dot color="#1677ff" />,
            greenDot: <Dot color="#52c41a" />,
            redDot: <Dot color="#ff4d4f" />,
            grayDot: <Dot color="#bfbfbf" />,
        },
        searchPlaceholderKey: `${baseKey}.list.searchPlaceholder`,
        defaultSort: { field: 'connectionTitle', direction: 'asc' },
        bulkDelete: true,
        bulkActions: [
            {
                key: 'notifications',
                labelKey: `${baseKey}.notifications.bulk.button`,
                run: ({ ids, dialog, clearSelection }) => {
                    const schedulerIds = ids
                        .map(Number)
                        .filter((id) => Number.isFinite(id))
                    if (schedulerIds.length === 0) return
                    const dialogId = dialog.open({
                        width: 720,
                        content: (
                            <BulkNotificationsDialogContent
                                schedulerIds={schedulerIds}
                                onClose={() => dialog.closeById(dialogId)}
                                onCreated={clearSelection}
                            />
                        ),
                    })
                },
            },
        ],
        useRowDecoration: () => {
            const {wasRecentlyUpdated} = useCurrentSchedules();
            return {
                rowClassName: (row) => {
                    const schedulerId = (row as Schedule).schedulerId;
                    return wasRecentlyUpdated(schedulerId) ? 'schedule-row--highlighted' : undefined;
                },
            };
        },
        actions: [
            {
                type: 'custom',
                key: 'support-logs',
                render: ({ row }) => <SupportLogsAction schedule={row as Schedule} />,
            },
            {
                type: 'custom',
                key: 'notifications',
                render: ({ row }) => <NotificationsAction schedule={row as Schedule} />,
            },
            { type: 'delete' },
        ],
    },

    i18n: {
        en,
        de,
    },

    /* ===============================
       FIELDS
    ============================== */

    fields: [
        // General Data
        {
            name: 'title',
            type: 'string',
            ui: {
                component: 'input',
                props: {
                    autoFocus: true,
                    labelKey: `${baseKey}.fields.title.label`,
                },
            },
            validation: {
                required: true,
                max: 255,
            },
        },
        {
            name: 'connectionId',
            type: 'number',
            ui: {
                component: 'select',
                props: {
                    labelKey: `${baseKey}.fields.connection.label`,
                    asyncOptions: {
                        url: '/connection/all/meta',
                        map: (data: any[]) => data.map(item => ({
                            value: item.id,
                            label: item.title
                        }))
                    }
                }
            },
            validation: {
                required: true,
            },
        },
        {
            name: 'debugMode',
            type: 'boolean',
            defaultValue: false,
            ui: {
                component: 'switch',
                props: {
                    labelKey: `${baseKey}.fields.debugMode.label`,
                    textKey: {
                        on: `${baseKey}.fields.debugMode.text.on`,
                        off: `${baseKey}.fields.debugMode.text.off`,
                    }
                }
            },
            table: {
                visible: true,
                order: 7,
                align: 'center',
                labelKey: `${baseKey}.list.columns.debugMode`,
                render: (row) => <DebugModeCell schedule={row as Schedule} />,
            },
        },
        {
            name: 'cronExp',
            label: `${baseKey}.fields.cronExp.label`,
            type: 'other',
            ui: {
                component: 'input',
                overrideKey: 'cronEditor',
            },
            validation: {
                custom: [
                    {
                        validate: (value) =>
                        {
                            if (!value) {
                                return true;
                            }
                            return cron(stripSeconds(value), { override: { useBlankDay: true } }).isValid();
                        },
                        message: `${baseKey}.fields.cronExp.error.invalid`,
                    }
                ]
            },
            table: {
                visible: true,
                order: 3,
                align: 'center',
                labelKey: `${baseKey}.list.columns.cronExp`,
                render: (row) => <CronCell schedule={row as Schedule} />,
            },
        },

        // List-only virtual columns
        {
            name: 'status',
            type: 'other',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 1,
                width: 56,
                align: 'center',
                labelKey: `${baseKey}.list.columns.status`,
                mapToValue: () => null,
                render: (row) => <StatusCell schedule={row as Schedule} />,
            },
        },
        {
            name: 'connectionTitle',
            type: 'string',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 2,
                sortable: true,
                searchable: true,
                labelKey: `${baseKey}.list.columns.connection`,
                mapToValue: (row) => (row as Schedule).connection?.title ?? '',
                render: (row) => <ConnectionTitleCell schedule={row as Schedule} />,
            },
        },
        {
            name: 'lastSuccessExecution',
            type: 'other',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 4,
                sortable: true,
                align: 'center',
                labelKey: `${baseKey}.list.columns.lastSuccessExecution`,
                mapToValue: (row) => (row as Schedule).lastExecution?.success?.startTime ?? 0,
                render: (row) => (
                    <ExecutionCell
                        execution={(row as Schedule).lastExecution?.success}
                        logs={{
                            connectionId: (row as Schedule).connection.connectionId,
                            schedulerId: (row as Schedule).schedulerId,
                            status: 's',
                        }}
                    />
                ),
            },
        },
        {
            name: 'lastFailExecution',
            type: 'other',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 5,
                sortable: true,
                align: 'center',
                labelKey: `${baseKey}.list.columns.lastFailExecution`,
                mapToValue: (row) => (row as Schedule).lastExecution?.fail?.startTime ?? 0,
                render: (row) => (
                    <ExecutionCell
                        execution={(row as Schedule).lastExecution?.fail}
                        logs={{
                            connectionId: (row as Schedule).connection.connectionId,
                            schedulerId: (row as Schedule).schedulerId,
                            status: 'f',
                        }}
                    />
                ),
            },
        },
        {
            name: 'lastDuration',
            type: 'other',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 6,
                sortable: true,
                align: 'center',
                labelKey: `${baseKey}.list.columns.lastDuration`,
                mapToValue: (row) => (row as Schedule).lastExecution?.success?.duration ?? 0,
                render: (row) => (
                    <DurationCell duration={(row as Schedule).lastExecution?.success?.duration} />
                ),
            },
        },
        {
            name: 'webhook',
            type: 'other',
            ui: { component: 'input' },
            table: {
                visible: true,
                order: 8,
                width: 60,
                align: 'center',
                labelKey: `${baseKey}.list.columns.webhook`,
                mapToValue: () => null,
                render: (row) => <WebhookCell schedule={row as Schedule} />,
            },
        },
    ],

    /* ===============================
       SECTIONS
    ============================== */

    sections: [
        {
            id: 'general-data',
            fields: [
                'title',
                'connectionId',
                'debugMode',
                'cronExp',
            ]
        }
    ],

    /* ===============================
       WIZARD
    ============================== */

    wizard: {
        image: scheduleWizardImage as string,

        modes: {
            create: {
                header: `${baseKey}.wizard.modes.create.header`,
                subheader: `${baseKey}.wizard.modes.create.subheader`,
                successMessage: `${baseKey}.wizard.modes.create.successMessage`,
                getSuccessMessage: (formData: ScheduleUpdateDTO) => buildScheduleSuccessMessage('create', formData),
            },
            update: {
                header: `${baseKey}.wizard.modes.update.header`,
                subheader: `${baseKey}.wizard.modes.update.subheader`,
                successMessage: `${baseKey}.wizard.modes.update.successMessage`,
                getSuccessMessage: (formData: ScheduleUpdateDTO) => buildScheduleSuccessMessage('update', formData),
            },
            view: {
                header: `${baseKey}.wizard.modes.view.header`,
                subheader: `${baseKey}.wizard.modes.view.header`,
            }
        },

        recommendations: [
            {
                title: `${baseKey}.wizard.recommendations.1`,
                link: '/schedule/create'
            },
            {
                title: `${baseKey}.wizard.recommendations.2`,
                link: '/connection/create'
            },
            {
                title: `${baseKey}.wizard.recommendations.3`,
                link: '/connector/create'
            },
        ],

        steps: [
            {
                id: 'general-data',
                header: `${baseKey}.wizard.steps.general-data.header`,
                subheader: `${baseKey}.wizard.steps.general-data.subheader`,
                sectionIds: ['general-data'],
                validateFields: ['title', 'connectionId', 'cronExp'],
            },
        ]
    },
    commands: (def) => (
        [
            ...createEntityCommands({def, config: {}, dsl: {
                    update: {
                        by: [
                            { field: 'connection.title', resolve: resolveScheduleConnectionTitles },
                            {
                                field: 'id',
                                resolve: resolveScheduleIds,
                                customPath: true,
                            }
                        ]
                    },
                    delete: {
                        by: [
                            {
                                field: 'id',
                                resolve: resolveScheduleIds,
                                customPath: true,
                                afterDelete: async () => {
                                    await store.dispatch(
                                        scheduleApi.util.invalidateTags([
                                            { type: SCHEDULE_TAG, id: 'LIST' }
                                        ])
                                    );
                                },
                                confirmMessage: (id) => {
                                    const t = i18n.getFixedT(i18n.language, 'entities');
                                    return t(`${baseKey}.confirmation.delete.byId`, {id});
                                }
                            },
                            {
                                field: 'connection.title',
                                resolve: resolveScheduleConnectionTitles,
                                confirmMessage: (connectionTitle) => {
                                    const t = i18n.getFixedT(i18n.language, 'entities');
                                    return t(`${baseKey}.confirmation.delete.byConnectionTitle`, {connectionTitle});
                                }
                            }
                        ]
                    },
                    view: {
                        by: [
                            {
                                field: 'id',
                                resolve: resolveScheduleIds,
                                customPath: true,
                            },
                            {
                                field: 'connection.title',
                                resolve: resolveScheduleConnectionTitles
                            }
                        ]
                    }
                }})
        ]
    )
}
