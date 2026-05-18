import {useContext} from "react"
import {SupportFileEventsContext} from "./SupportFileEventsContext"

export function useSupportFileEvents() {
    return useContext(SupportFileEventsContext)
}
