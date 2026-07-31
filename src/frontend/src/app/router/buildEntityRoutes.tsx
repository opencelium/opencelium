import {entityRegistry} from "@/engine/entity/EntityRegistry.ts";
import {resolveElement, resolveLayout, resolvePath} from "@app/router/routeResolver.tsx";

export function buildEntityRoutes() {
    const appRoutes: any[] = [];
    const publicRoutes: any[] = [];
    const authRoutes: any[] = [];

    entityRegistry.getAll().forEach(entity => {
        entity.routes?.forEach(route => {
            const type = route.type;

            const path = route?.path ?? resolvePath(route?.entityRouteName || entity.name, type);
            const element = route?.element ?? resolveElement(entity.name, type);
            const layout = route?.layout ?? resolveLayout(type);

            const target =
                layout === 'public'
                    ? publicRoutes
                    : layout === 'auth'
                        ? authRoutes
                        : appRoutes;

            target.push({
                path,
                element,
            });
        });
    });

    return { appRoutes, publicRoutes, authRoutes };
}
