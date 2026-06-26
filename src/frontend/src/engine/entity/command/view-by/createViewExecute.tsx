import {useCommandPaletteUIStore} from "@widgets/CommandPalette/command-palette.store.ts";
import {GenericViewWizard} from "@/engine/entity/runtime/genererics/GenericViewWizard.tsx";
import {store} from "@app/store/store.ts";
import {genericApi} from "@shared/api/genericApi.ts";

export const createViewExecute = ({ def, config, by }) => {
    return async (args, ctx) => {
        const value = args.identifier as string;

        if (by.beforeOpen) {
            await by.beforeOpen(value, ctx);
        }

        const encoded = encodeURIComponent(value);

        const fetchUrl =
            by.buildFetchUrl?.(def, value) ??
            (by.customPath
                ? `${def.api?.baseUrl}/${encoded}`
                : `${def.api?.baseUrl}/${by.field}/${encoded}`);

        const navigationUrl =
            by.buildNavigationUrl?.(def, value) ??
            (by.customPath
                ? `/${def.name}/view/${encoded}`
                : `/${def.name}/view/${by.field}/${encoded}`);

        ctx.setLoading(true);
        const mode = useCommandPaletteUIStore.getState().resolveMode();

        try {
            const result = await store.dispatch(
                genericApi.endpoints.fetchEntities.initiate(fetchUrl)
            ).unwrap();
            const wizard = (
                <GenericViewWizard
                    entityName={def.name}
                    identifier={value}
                    initialRecord={result}
                />
            );

            if (mode === 'route') return ctx.navigate(navigationUrl);
            if (mode === 'new-tab') return ctx.openNewTab(navigationUrl);

            if (mode === 'modal') {
                if (config?.overrides?.view) {
                    return ctx.openModal(
                        config.overrides.view(def, ctx, result)
                    );
                }
                return ctx.openModal(wizard);
            }
            ctx.render(wizard);

            if (by.afterOpen) {
                await by.afterOpen(value, ctx);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            ctx.setLoading(false);
        }
    };
};
