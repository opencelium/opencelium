import { boundaryService } from '../boundaryService'

export function initBoundaryLogSubscriber(): () => void {
    return boundaryService.subscribe(({ error, errorInfo, scope }) => {
        console.error('[BoundaryError]', {
            scope,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo?.componentStack,
        })
    })
}
