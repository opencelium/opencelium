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
        const { mode } = useCommandPaletteUIStore.getState();

        try {
            const result = await store.dispatch(
                genericApi.endpoints.fetchEntities.initiate(fetchUrl)
            ).unwrap();

            const wizard = (
                <GenericUpdateWizard
                    entityName={def.name}
                    identifier={value}
                    initialRecord={result}
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
