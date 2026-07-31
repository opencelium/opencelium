import type {AppError} from "@shared/errors/types.ts";

type ErrorListener = (error: AppError) => void

class ErrorBus {
    private listeners = new Set<ErrorListener>()

    emit(error: AppError) {
        this.listeners.forEach((l) => l(error))
    }

    subscribe(listener: ErrorListener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }
}

export const errorBus = new ErrorBus()
