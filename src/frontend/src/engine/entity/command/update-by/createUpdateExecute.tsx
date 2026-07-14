import {store} from "@app/store/store.ts";
import {genericApi} from "@shared/api/genericApi.ts";
import {useCommandPaletteUIStore} from "@widgets/CommandPalette/command-palette.store.ts";
import {GenericUpdateWizard} from "@/engine/entity/runtime/genererics/GenericUpdateWizard.tsx";

export const createUpdateExecute = ({ def, config, by }) => {
    return async (args, ctx) => {
        const value = args.identifier;

        const fetchUrl =
            by.buildFetchUrl?.(def, value) ??
            (by.customPath
                ? `${def.api?.baseUrl}/${value}`
                : `${def.api?.baseUrl}/${by.field}/${value}`);

        const navigationUrl =
            by.buildNavigationUrl?.(def, value) ??
            (by.customPath
                ? `/${def.name}/update/${value}`
                : `/${def.name}/update/${by.field}/${value}`);

        ctx.setLoading(true);
        const mode = useCommandPaletteUIStore.getState().resolveMode();

        try {
            // subscribe: false — this is a one-off fetch to seed the wizard's
            // initialRecord. A plain dispatch (no owning component/hook) never
            // unsubscribes on its own, which would otherwise leak a permanent
            // RTK Query subscription that keeps refetching this URL on every
            // future entity mutation for the rest of the session.
            const result = await store.dispatch(
                genericApi.endpoints.fetchEntities.initiate(fetchUrl, { subscribe: false })
            ).unwrap();

            // `value` is whatever the user typed/selected (title, name, id, ...);
            // the submit URL must use the real primary key, which is only known
            // once the record is fetched — resolving by title otherwise sends
            // the title itself as the PUT path segment.
            const primaryKey = def.api?.primaryKey;
            const resolvedIdentifier = primaryKey && result && typeof result === 'object' && primaryKey in result
                ? String((result as Record<string, unknown>)[primaryKey])
                : value;

            const wizard = (
                <GenericUpdateWizard
                    entityName={def.name}
                    identifier={resolvedIdentifier}
                    initialRecord={result}
                    hideRecommendations={ctx.hideRecommendations}
                />
            );

            if (mode === 'route') return ctx.navigate(navigationUrl);
            if (mode === 'new-tab') return ctx.openNewTab(navigationUrl);

            if (mode === 'modal') {
                if (config?.overrides?.update) {
                    return ctx.openModal(
                        config.overrides.update(def, ctx, result)
                    );
                }
                return ctx.openModal(wizard);
            }

            ctx.render(wizard);

        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            ctx.setLoading(false);
        }
    };
};
