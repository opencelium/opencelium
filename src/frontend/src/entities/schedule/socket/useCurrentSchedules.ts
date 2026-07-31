import {useContext} from "react"
import {CurrentSchedulesContext} from "./CurrentSchedulesContext"

export function useCurrentSchedules() {
    return useContext(CurrentSchedulesContext)
}
