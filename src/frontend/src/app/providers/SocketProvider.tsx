import type {ReactNode} from "react"
import {SocketTransportProvider} from "@shared/api/socket/SocketTransportProvider"
import {SessionEventsHandler} from "@features/auth/socket/SessionEventsHandler"
import {CurrentSchedulesProvider} from "@entities/schedule/socket/CurrentSchedulesProvider"
import {CurrentSubscriptionProvider} from "@entities/subscription/socket/CurrentSubscriptionProvider"
import {SupportFileEventsProvider} from "@entities/supportFile/socket/SupportFileEventsProvider"
import {SystemMetricsProvider} from "@widgets/SystemMetrics/socket/SystemMetricsProvider"

type Props = {children: ReactNode}

export function SocketProvider({children}: Props) {
    return (
        <SocketTransportProvider>
            <SessionEventsHandler />
            <CurrentSchedulesProvider>
                <CurrentSubscriptionProvider>
                    <SupportFileEventsProvider>
                        <SystemMetricsProvider>
                            {children}
                        </SystemMetricsProvider>
                    </SupportFileEventsProvider>
                </CurrentSubscriptionProvider>
            </CurrentSchedulesProvider>
        </SocketTransportProvider>
    )
}
