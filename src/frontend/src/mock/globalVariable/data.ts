import type {
    ActorRef,
    GlobalVariable,
    GlobalVariableChange,
    GlobalVariableUsage,
    PermissionGrant,
} from '@entities/globalVariable/model/types'

const admin: ActorRef = { type: 'USER', id: 1, name: 'admin' }
const vmwareSync: ActorRef = { type: 'WORKFLOW', id: 42, name: 'VMware → i-doit' }
const allPermissions: GlobalVariable['myPermissions'] = ['VIEW_USE', 'EDIT', 'DELETE']
const scopeAll = { type: 'ALL' as const, categories: [], workflows: [] }

const audit = (createdAt: string, updatedAt: string, updatedBy: ActorRef = admin) => ({
    ownerUser: { id: 1, name: 'admin' },
    myPermissions: allPermissions,
    createdAt,
    createdBy: admin,
    updatedAt,
    updatedBy,
})

export const seedVariables = (): GlobalVariable[] => [
    {
        id: 1,
        name: 'idoitUrl',
        kind: 'CONSTANT',
        description: 'i-doit JSON-RPC endpoint',
        value: 'https://cmdb.example',
        secret: false,
        hasValue: true,
        scope: scopeAll,
        version: 3,
        ...audit('2026-11-02T09:00:00Z', '2026-11-12T10:00:00Z'),
    },
    {
        id: 2,
        name: 'idoitApiKey',
        kind: 'CONSTANT',
        description: 'API key for i-doit',
        value: 's3cr3t-key',
        secret: true,
        hasValue: true,
        scope: scopeAll,
        version: 2,
        ...audit('2026-11-02T09:05:00Z', '2026-11-10T08:00:00Z'),
    },
    {
        id: 7,
        name: 'tenants',
        kind: 'CONSTANT',
        description: 'Tenants to sync',
        value: [
            { id: 'acme', region: 'eu' },
            { id: 'globex', region: 'us' },
        ],
        secret: false,
        hasValue: true,
        scope: { type: 'CATEGORIES', categories: [{ id: 3, name: 'Frontend' }], workflows: [] },
        version: 4,
        ...audit('2026-11-02T09:00:00Z', '2026-11-16T09:12:00Z'),
    },
    {
        id: 12,
        name: 'lastSync',
        kind: 'MUTABLE',
        description: 'Cursor for the VMware sync',
        value: '2026-11-17T22:00:00Z',
        writePolicy: 'FORWARD_ONLY',
        publishMode: 'ON_SUCCESS',
        ownerWorkflow: { id: 42, title: 'VMware → i-doit' },
        beingUpdatedBy: null,
        scope: { type: 'WORKFLOWS', categories: [], workflows: [{ id: 42, name: 'VMware → i-doit' }] },
        version: 128,
        ...audit('2026-11-03T09:00:00Z', '2026-11-17T22:04:11Z', vmwareSync),
    },
    {
        id: 13,
        name: 'syncedVmCount',
        kind: 'MUTABLE',
        description: 'VMs synced so far',
        value: 1520,
        writePolicy: 'INCREMENT',
        publishMode: 'EACH_WRITE',
        ownerWorkflow: null,
        beingUpdatedBy: null,
        scope: scopeAll,
        version: 41,
        ...audit('2026-11-03T09:10:00Z', '2026-11-17T22:04:11Z', vmwareSync),
    },
    {
        id: 15,
        name: 'buildTicketTitle',
        kind: 'SCRIPT',
        description: 'Ticket title for i-doit',
        script: {
            language: 'js',
            code: [
                'var id = ref("${ticketId}");',
                'var tenant = ref("{tenant}");',
                'var when = globals.normalizeDate(created, ref("{{global.defaultTz}}"));',
                'var host = ref("#FFCF00.(response).host.name");',
                'return tenant + "-" + id + " " + host + " [" + priority + "] " + when;',
            ].join('\n'),
            parameters: [
                { name: 'created', required: true, default: null },
                { name: 'priority', required: false, default: 'low' },
            ],
            imports: ['normalizeDate'],
            refs: [
                { ref: '${ticketId}', type: 'WEBHOOK' },
                { ref: '{tenant}', type: 'REQUEST_DATA' },
                { ref: '{{global.defaultTz}}', type: 'GLOBAL' },
                { ref: '#FFCF00.(response).host.name', type: 'METHOD_RESPONSE', warning: 'TIED_TO_CALLER_COLORS' },
            ],
        },
        scope: scopeAll,
        version: 3,
        ...audit('2026-11-05T09:00:00Z', '2026-11-15T14:30:00Z'),
    },
    {
        id: 16,
        name: 'normalizeDate',
        kind: 'SCRIPT',
        description: 'Formats a date as ISO-8601 in a time zone',
        script: {
            language: 'js',
            code: 'return new Date(value).toISOString();',
            parameters: [
                { name: 'value', required: true, default: null },
                { name: 'tz', required: false, default: 'UTC' },
            ],
            imports: [],
            refs: [],
        },
        scope: scopeAll,
        version: 1,
        ...audit('2026-11-05T08:00:00Z', '2026-11-05T08:00:00Z'),
    },
]

export const seedUsages = (): Record<number, GlobalVariableUsage[]> => ({
    1: [
        { sourceType: 'CONNECTOR', sourceId: 3, sourceTitle: 'i-doit', field: 'requestData.url', access: 'READ' },
    ],
    12: [
        {
            sourceType: 'WORKFLOW', sourceId: 42, sourceTitle: 'VMware → i-doit', elementType: 'SET_STEP',
            elementLabel: 'Save cursor', index: '0_3', access: 'WRITE',
        },
        { sourceType: 'NOTIFICATION', sourceId: 17, sourceTitle: 'Sync report', field: 'body', access: 'READ' },
    ],
    15: [
        {
            sourceType: 'WORKFLOW', sourceId: 42, sourceTitle: 'VMware → i-doit', elementType: 'METHOD',
            elementLabel: 'Create object', color: '#FFCF00', index: '0_1', field: 'body.created_at', access: 'CALL',
            arguments: { created: '#FFCF00.(response).vm[].created' },
        },
    ],
    16: [{ sourceType: 'SCRIPT_VARIABLE', sourceId: 15, sourceTitle: 'buildTicketTitle', access: 'IMPORT' }],
})

export const seedGrants = (): Record<number, PermissionGrant[]> => ({
    7: [{ user: { id: 5, name: 'jdoe' }, permissions: ['VIEW_USE'] }],
    12: [{ user: { id: 9, name: 'msmith' }, permissions: ['VIEW_USE', 'EDIT'] }],
})

export const seedChanges = (): Record<number, GlobalVariableChange[]> => ({
    12: [
        {
            id: 903,
            changeType: 'VALUE',
            versionFrom: 127,
            versionTo: 128,
            oldValue: '2026-11-16T22:00:00Z',
            newValue: '2026-11-17T22:00:00Z',
            writeCount: 312,
            changedFields: null,
            actor: { type: 'WORKFLOW', workflowId: 42, workflowTitle: 'VMware → i-doit', schedulerId: 7, executionId: 411 },
            source: {
                workflow: { id: 42, title: 'VMware → i-doit', executionId: 411, trigger: 'SCHEDULE', startedBy: null },
                step: { type: 'SET_STEP', index: '0_3', label: 'Save cursor', loopPass: 312 },
                valueKind: 'REFERENCE',
                origins: [
                    {
                        method: { color: '#FFCF00', name: 'List VMs', index: '0_1' },
                        part: 'RESPONSE',
                        section: 'BODY',
                        path: 'meta.lastModified',
                        connector: { id: 3, title: 'vCenter prod', invoker: 'vmware' },
                        share: null,
                    },
                ],
            },
            result: 'SAVED',
            reason: null,
            changedAt: '2026-11-17T22:04:11Z',
            restorable: true,
        },
        {
            id: 880,
            changeType: 'VALUE',
            versionFrom: 126,
            versionTo: 126,
            oldValue: '2026-11-16T22:00:00Z',
            newValue: '2026-11-15T00:00:00Z',
            writeCount: 1,
            changedFields: null,
            actor: { type: 'WORKFLOW', workflowId: 42, workflowTitle: 'VMware → i-doit', schedulerId: 7, executionId: 402 },
            source: null,
            result: 'REJECTED',
            reason: 'FORWARD_ONLY: new value is not greater than the current one',
            changedAt: '2026-11-16T22:03:40Z',
            restorable: false,
        },
    ],
})
