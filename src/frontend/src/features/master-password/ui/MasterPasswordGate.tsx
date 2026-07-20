import React, { useEffect, useState } from 'react'
import { Typography } from '@shared/ui/primitives/Typography'
import { Loading } from '@shared/ui/primitives/Loading/Loading'
import { apiExecutor } from '@shared/api/apiExecutor'
import { useMasterPasswordStore } from '@features/master-password/model/masterPasswordStore'
import { MasterPasswordDialog } from '@features/master-password/ui/MasterPasswordDialog'

type MasterPasswordGateProps = {
    children: React.ReactNode
    title?: React.ReactNode
    label?: string
    info?: { title: string; content: string }
}

const isApiExecutorError = (response: unknown): boolean =>
    !!response && typeof response === 'object' && ('status' in response || 'error' in response)

/**
 * Renders `children` only once a master password has been entered; otherwise
 * shows the unlock prompt. Reuse to put any sensitive view behind the master
 * password (connector credentials, system configuration, …).
 *
 * The unlock prompt itself only appears when a master password is actually
 * configured on the backend — if none exists, there is nothing to unlock, so
 * `children` render directly.
 */
export const MasterPasswordGate: React.FC<MasterPasswordGateProps> = ({ children, title, label, info }) => {
    const { masterPassword } = useMasterPasswordStore()
    const [existsState, setExistsState] = useState<'loading' | boolean>('loading')

    useEffect(() => {
        if (masterPassword) return
        let cancelled = false
        // Routed through apiExecutor (not an RTK Query hook) because this gate can be
        // rendered inside the workflow editor's isolated legacy redux <Provider> (see
        // GraphQlBodyEditor), which only mounts the `connection` reducer — not the real
        // app's baseApi/middleware. A hook-bound dispatch would bind to that wrong store.
        // apiExecutor dispatches against the real app store directly, sidestepping that.
        void (async () => {
            const response = await apiExecutor({
                url: '/connector/master-password/status/exist',
                method: 'GET',
                options: { ignoreError: true },
            })
            if (cancelled) return
            // Fail-safe: on an API error, assume a master password exists rather than
            // accidentally exposing gated content.
            setExistsState(isApiExecutorError(response) ? true : Boolean(response))
        })()
        return () => {
            cancelled = true
        }
    }, [masterPassword])

    if (masterPassword) {
        return <>{children}</>
    }

    if (existsState === 'loading') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Loading />
            </div>
        )
    }

    if (existsState === false) {
        return <>{children}</>
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                minHeight: 320,
                padding: 24,
            }}
        >
            {title && (
                <Typography variant="subtitle" isSubtle>
                    {title}
                </Typography>
            )}
            <MasterPasswordDialog label={label} info={info} />
        </div>
    )
}
