import type { Connector, ConnectorMetaDTO } from '@entities/connector/model/types'
import type { Invoker, InvokerOperation, OperationBody } from '@entities/invoker/model/types'

/**
 * Two invented systems for the workflow tutorial: a CRM that lists customers and a
 * support desk that keeps client accounts. Shaped around the one scenario the tutorial
 * builds — list customers, loop over them, look each one up in the second system by
 * email, and create the ones it does not know yet:
 *
 * - `getCustomers` returns `firstName`/`lastName`/`email`, so the loop has something
 *   to reference per iteration, and two of those fields have to be joined for one
 *   target field — which is what forces an enhancement rather than a plain reference.
 * - `getClientByEmail` takes the email in its endpoint, so the reference has to go in
 *   a URL rather than a body.
 * - It answers with a plain `found` flag, so the IF operator's condition is one
 *   comparison instead of an exercise in array emptiness.
 *
 * Nothing here is ever sent anywhere. The tutorial seeds these into the connector
 * and invoker query caches and disables saving, so the graph the user builds is a
 * sketch on real UI. Ids are negative to make an accidental real request obvious.
 */
const body = (fields: unknown, type: OperationBody['type'] = 'object'): OperationBody =>
    ({ data: 'raw', fields, format: 'json', type })

const operation = (
    name: string,
    method: InvokerOperation['request']['method'],
    endpoint: string,
    requestFields: unknown,
    responseFields: unknown,
): InvokerOperation => ({
    name,
    type: 'default',
    request: { body: body(requestFields), endpoint, header: {}, method },
    response: {
        name,
        success: { status: '200', header: {}, body: body(responseFields) },
        fail: { status: '400', header: {}, body: body({ message: 'string' }) },
    },
})

const CRM_INVOKER: Invoker = {
    name: 'tutorial-crm.xml',
    description: 'Sample CRM used by the tutorial',
    authType: 'basic',
    hasManualSync: false,
    hint: '',
    icon: '',
    requiredData: { Url: '', Username: '', Password: '' },
    operations: [
        operation('getCustomers', 'GET', '/customers', {}, {
            customers: [{
                id: 'string', email: 'string', firstName: 'string', lastName: 'string', company: 'string',
            }],
        }),
        operation('getCustomerById', 'GET', '/customers/{id}', {}, {
            id: 'string', email: 'string', firstName: 'string', lastName: 'string', company: 'string',
        }),
    ],
}

const SUPPORT_INVOKER: Invoker = {
    name: 'tutorial-support.xml',
    description: 'Sample support desk used by the tutorial',
    authType: 'basic',
    hasManualSync: false,
    hint: '',
    icon: '',
    requiredData: { Url: '', Username: '', Password: '' },
    operations: [
        operation('getClientByEmail', 'GET', '/clients?email=', {}, {
            found: 'boolean',
            client: { id: 'string', email: 'string', username: 'string' },
        }),
        operation('createClient', 'POST', '/clients',
            { email: 'string', username: 'string' },
            { id: 'string', email: 'string', username: 'string' }),
    ],
}

export const TUTORIAL_INVOKERS: Invoker[] = [CRM_INVOKER, SUPPORT_INVOKER]

const connector = (connectorId: number, title: string, description: string, invoker: Invoker): Connector => ({
    connectorId,
    title,
    description,
    icon: null,
    invoker,
    requestData: {},
    sslCert: false,
    timeout: 30,
    status: 'UP',
    lastTestError: null,
    lastCheckedAt: null,
})

export const TUTORIAL_CONNECTORS: Connector[] = [
    connector(-9001, 'Tutorial CRM', 'Where your customers live', CRM_INVOKER),
    connector(-9002, 'Tutorial Support Desk', 'Where client accounts live', SUPPORT_INVOKER),
]

/**
 * The sidebar browses connectors from the cheaper /connector/meta/all snapshot, not
 * from /connector/all — so the tutorial has to seed both or the list comes up empty
 * while the methods behind it resolve fine. Derived here so the two cannot disagree.
 */
export const TUTORIAL_CONNECTORS_META: ConnectorMetaDTO[] = TUTORIAL_CONNECTORS.map(
    ({ connectorId, title, icon, sslCert, timeout, invoker, status, lastTestError, lastCheckedAt }) => ({
        connectorId,
        title,
        icon: typeof icon === 'string' ? icon : null,
        sslCert,
        timeout,
        invoker: { name: invoker.name },
        status,
        lastTestError,
        lastCheckedAt,
    }),
)
