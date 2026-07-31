import type {BoundaryError} from "@shared/errors/types.ts";


type BoundaryListener = (error: BoundaryError) => void

class BoundaryService {
    private listeners = new Set<BoundaryListener>()

    report(error: BoundaryError) {
        this.listeners.forEach((l) => l(error))
    }

    subscribe(listener: BoundaryListener): () => void {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }
}

export const boundaryService = new BoundaryService()
