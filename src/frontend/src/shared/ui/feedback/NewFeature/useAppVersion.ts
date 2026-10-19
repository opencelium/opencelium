import { useEffect, useSyncExternalStore } from 'react'
import { store } from '@app/store/store'
import { updateAssistantApi } from '@entities/updateAssistant/api/updateAssistantApi'

const selectAppVersion = updateAssistantApi.endpoints.getAppVersion.select()
const getVersion = () => selectAppVersion(store.getState()).data?.version?.trim()

/**
 * Reads the app store directly instead of `useGetAppVersionQuery`: badges also
 * render inside the workflow method editors, which wrap their tree in a
 * per-modal legacy Redux `<Provider>` without the RTK Query middleware, so the
 * hook would resolve to that store and throw.
 */
export function useAppVersion(): string | undefined {
    useEffect(() => {
        const subscription = store.dispatch(updateAssistantApi.endpoints.getAppVersion.initiate())
        return () => subscription.unsubscribe()
    }, [])
    return useSyncExternalStore(store.subscribe, getVersion)
}
