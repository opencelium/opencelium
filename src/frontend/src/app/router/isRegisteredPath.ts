import { matchRoutes } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { getRoutes } from './routes'

// Same-tab browser history `state.from` (see AuthGuard/LoginPage) can outlive
// a deploy: after an upgrade a stashed pathname may no longer map to any real
// route (an entity route was renamed/removed), and would otherwise fall
// through to the `*` NotFoundPage route — which `matchRoutes` still reports
// as a match. Treat that catch-all branch as "unregistered".
export function isRegisteredPath(pathname: string): boolean {
    const matches = matchRoutes(getRoutes() as unknown as RouteObject[], pathname)
    if (!matches || matches.length === 0) return false
    return matches[matches.length - 1].route.path !== '*'
}
