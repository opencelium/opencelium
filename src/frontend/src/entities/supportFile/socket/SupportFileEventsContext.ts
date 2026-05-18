import {createContext} from "react"

export type SupportFileEventsContextValue = {
    hasNewSupportFile: boolean
    clear: () => void
}

export const SupportFileEventsContext = createContext<SupportFileEventsContextValue>({
    hasNewSupportFile: false,
    clear: () => {},
})
