import { useCallback, useMemo, useState } from 'react'
import type { Invoker } from '@entities/invoker/model/types'
import {
    DEFAULT_CONNECTOR_TIMEOUT,
    DEFAULT_CREDENTIAL_FIELDS,
    useCheckOnboardingConnectorMutation,
    useCreateOnboardingConnectorMutation,
} from './onboardingApi'

export type ConnectorDraft = {
    title: string
    description: string
    invoker: string
    timeout: number
    requestData: Record<string, string>
    saveStatus: 'idle' | 'error'
}

const EMPTY_DRAFT: ConnectorDraft = {
    title: '',
    description: '',
    invoker: '',
    timeout: DEFAULT_CONNECTOR_TIMEOUT,
    requestData: {},
    saveStatus: 'idle',
}

/** HTTP 200 from /connector/check means the credentials reached the system. */
const CHECK_OK = '200'

/**
 * The connector the user builds inside the tour: draft state plus the two calls
 * that act on it. Every edit clears `saveStatus` so a previous failure doesn't
 * keep the submit button disabled after the user fixes the input.
 */
export function useConnectorDraft({ invokers, onSaved }: { invokers: Invoker[]; onSaved: () => void }) {
    const [draft, setDraft] = useState<ConnectorDraft>(EMPTY_DRAFT)
    const [checkConnector] = useCheckOnboardingConnectorMutation()
    const [createConnector, { isLoading: saving }] = useCreateOnboardingConnectorMutation()

    const edit = useCallback((patch: Partial<ConnectorDraft>) => {
        setDraft(current => ({ ...current, ...patch, saveStatus: 'idle' }))
    }, [])

    const setInvoker = useCallback((invokerName: string) => {
        const requiredData = invokers.find(item => item.name === invokerName)?.requiredData ?? {}
        setDraft(current => ({
            ...current,
            invoker: invokerName,
            requestData: Object.keys(requiredData).length > 0 ? { ...requiredData } : { ...DEFAULT_CREDENTIAL_FIELDS },
            saveStatus: 'idle',
        }))
    }, [invokers])

    const setCredential = useCallback((key: string, value: string) => {
        setDraft(current => ({ ...current, requestData: { ...current.requestData, [key]: value }, saveStatus: 'idle' }))
    }, [])

    const payload = useCallback((current: ConnectorDraft) => ({
        title: current.title,
        description: current.description,
        timeout: current.timeout,
        sslCert: false,
        invoker: { name: current.invoker },
        requestData: current.requestData,
    }), [])

    const test = useCallback(async (): Promise<'success' | 'error'> => {
        try {
            const response = await checkConnector(payload(draft)).unwrap()
            return String(response.status) === CHECK_OK ? 'success' : 'error'
        } catch {
            return 'error'
        }
    }, [checkConnector, draft, payload])

    const save = useCallback(async () => {
        setDraft(current => ({ ...current, saveStatus: 'idle' }))
        try {
            const created = await createConnector(payload(draft)).unwrap()
            if (!created?.connectorId) throw new Error('Connector was not created')
            onSaved()
        } catch {
            setDraft(current => ({ ...current, saveStatus: 'error' }))
        }
    }, [createConnector, draft, onSaved, payload])

    const reset = useCallback(() => setDraft(EMPTY_DRAFT), [])

    return useMemo(
        () => ({ draft, edit, setInvoker, setCredential, test, save, saving, reset }),
        [draft, edit, setInvoker, setCredential, test, save, saving, reset],
    )
}
