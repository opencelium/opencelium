import {type ReactNode, useMemo, useState} from "react"
import type {Metrics} from "@widgets/SystemMetrics/model/types"
import {useSocket} from "@shared/api/socket/useSocket"
import {useStompSubscription} from "@shared/api/socket/useStompSubscription"
import {SystemMetricsContext, type SystemMetricsContextValue} from "./SystemMetricsContext"

type Props = {children: ReactNode}

export function SystemMetricsProvider({children}: Props) {
    const {client, status} = useSocket()
    const [systemMetrics, setSystemMetrics] = useState<Metrics | null>(null)

    useStompSubscription<Metrics>(
        client,
        status === 'connected',
        '/subscription/system/metrics',
        setSystemMetrics,
    )

    const value = useMemo<SystemMetricsContextValue>(
        () => ({systemMetrics}),
        [systemMetrics],
    )

    return (
        <SystemMetricsContext.Provider value={value}>
            {children}
        </SystemMetricsContext.Provider>
    )
}
