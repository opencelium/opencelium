import { createContext, useContext } from 'react'
import type { StepContext } from './types'

export const StepFormContext =
    createContext<StepContext | null>(null)

export const useStepForm = () => {
    const ctx = useContext(StepFormContext)
    if (!ctx) {
        throw new Error('StepFormContext missing')
    }
    return ctx
}
