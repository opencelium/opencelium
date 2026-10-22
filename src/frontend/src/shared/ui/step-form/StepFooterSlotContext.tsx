import { createContext, useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// The wizard footer exposes a slot on its left (opposite the navigation buttons).
// Step content can show a status there while keeping access to its own state.
const StepFooterSlotContext = createContext<HTMLElement | null>(null)

export const StepFooterSlotProvider = StepFooterSlotContext.Provider

export function StepFooterStatus({ children }: { children: ReactNode }) {
    const slot = useContext(StepFooterSlotContext)
    return slot ? createPortal(children, slot) : null
}
