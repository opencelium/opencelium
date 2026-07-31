import { useRoutes } from 'react-router-dom'
import {getRoutes} from "@app/router/routes.tsx";

export function AppRouter() {
    const routes = getRoutes();
    return useRoutes(routes)
}
