import { AsyncLocalStorage } from 'node:async_hooks'

/** The HTTP request a model call is made for: which route, and a signal that fires once its caller has gone. */
export type RequestContext = { route: string; signal: AbortSignal }

const storage = new AsyncLocalStorage<RequestContext>()

/**
 * Runs `next` (and everything it starts) inside the request's context. The model client reads it from there, so no
 * route has to hand a signal through its feature code to stop an answer nobody waits for any more.
 */
export const runInRequestContext = (context: RequestContext, next: () => void) => storage.run(context, next)

export const currentRequestContext = (): RequestContext | undefined => storage.getStore()
