import {createContext} from "react"
import type {Metrics} from "@widgets/SystemMetrics/model/types"

export type SystemMetricsContextValue = {
    systemMetrics: Metrics | null
}

export const SystemMetricsContext = createContext<SystemMetricsContextValue>({
    systemMetrics: null,
})
