import { baseApi } from '@shared/api/baseApi'
import { connectorApi } from '@entities/connector/api/connectorApi'
import type { Connector } from '@entities/connector/model/types'

/** Backend default when the user doesn't touch the timeout field. */
export const DEFAULT_CONNECTOR_TIMEOUT = 30

/** Shown when the chosen invoker declares no `requiredData` of its own. */
export const DEFAULT_CREDENTIAL_FIELDS: Record<string, string> = { Url: '', Username: '', Password: '' }

export type OnboardingConnectorPayload = {
    title: string
    description: string
    timeout: number
    sslCert: boolean
    invoker: { name: string }
    requestData: Record<string, string>
}

type ConnectorCheckResponse = { status?: string | number; data?: { message?: string } }

export const onboardingApi = baseApi.injectEndpoints({
    endpoints: build => ({
        checkOnboardingConnector: build.mutation<ConnectorCheckResponse, OnboardingConnectorPayload>({
            query: body => ({ url: '/connector/check', method: 'POST', body }),
            extraOptions: { ignoreError: true },
        }),
        createOnboardingConnector: build.mutation<Connector, OnboardingConnectorPayload>({
            query: body => ({ url: '/connector', method: 'POST', body }),
            async onQueryStarted(_body, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled
                    dispatch(connectorApi.endpoints.getConnectorsMeta.initiate(undefined, {
                        forceRefetch: true,
                        subscribe: false,
                    }))
                } catch {
                    //
                }
            },
        }),
    }),
})

export const { useCheckOnboardingConnectorMutation, useCreateOnboardingConnectorMutation } = onboardingApi
