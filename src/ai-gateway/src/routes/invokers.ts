import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../app.ts'
import type { InvokerSummary } from '../invokers/invoker.types.ts'

export function registerInvokerRoutes(app: FastifyInstance, { invokers }: AppDeps) {
    app.get('/invokers', async (): Promise<InvokerSummary[]> => invokers.list())
}
