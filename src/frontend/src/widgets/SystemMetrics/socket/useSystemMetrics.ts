import {useContext} from "react"
import {SystemMetricsContext} from "./SystemMetricsContext"

export function useSystemMetrics() {
    return useContext(SystemMetricsContext)
}
