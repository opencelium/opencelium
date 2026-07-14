import {genericApi} from "@shared/api/genericApi.ts";
import {store} from "@app/store/store.ts";
import {i18n} from "@shared/i18n/config/i18n.ts";
import {message} from "antd";

// True when the browser is currently sitting on the view/update page of the
// exact record being deleted — that page's own query would otherwise refetch
// (mutations broadly invalidate the 'Entity' tag) and 404 against a record
// that no longer exists.
const isViewingRecord = (def, resolvedId: string): boolean => {
    const routeName = def.routes?.find((r) => r.entityRouteName)?.entityRouteName ?? def.name;
    const currentPath = window.location.pathname;
    return (
        currentPath === `/${routeName}/update/${resolvedId}` ||
        currentPath === `/${routeName}/view/${resolvedId}`
    );
};

export const createDeleteExecute = ({ def, config, by }) => {
    return async (args, ctx) => {

        const successTrans = i18n.getFixedT(i18n.language, 'success');
        const commonTrans = i18n.getFixedT(i18n.language, 'common');
        if (config?.overrides?.delete) {
            return config.overrides.delete(def, ctx);
        }

        const value = args.identifier as string;

        const confirmMessage =
            by.confirmMessage?.(value, def) ??
            commonTrans('question.confirmation.delete', {entityName: def.name, field: by.field, value});

        const confirmed = await ctx.confirm(confirmMessage);
        if (!confirmed) {
            ctx.setInputValue?.(
                `delete ${def.name} by ${by.field} `
            );
            return;
        }

        const encoded = encodeURIComponent(value);

        const deleteUrl =
            by.buildDeleteUrl?.(def, value) ??
            (by.customPath
                ? `${def.api.baseUrl}/${encoded}`
                : `${def.api.baseUrl}/${by.field}/${encoded}`);

        // Resolved by buildDeleteUrl (title/name -> id) when the entity supports
        // it; falls back to `value` itself for plain id-based deletes.
        const resolvedId = decodeURIComponent(deleteUrl.split('/').pop() ?? value);
        const wasViewingRecord = isViewingRecord(def, resolvedId);

        try {
            await store.dispatch(
                genericApi.endpoints.deleteEntity.initiate({ url: deleteUrl })
            ).unwrap();

            // optional post-delete logic
            if (by.afterDelete) {
                await by.afterDelete(value, ctx);
            }

            if (wasViewingRecord) {
                const routeName = def.routes?.find((r) => r.entityRouteName)?.entityRouteName ?? def.name;
                ctx.navigate(`/${routeName}`);
            } else {
                ctx.setInputValue?.(
                    `delete ${def.name} by ${by.field} `
                );
            }
            message.success(successTrans('api.deleted'));

        } catch (e) {
            // errorBus already surfaces the real API error as a toast (see
            // baseQuery.ts) — no need for a second, untranslated notification.
            console.error(e);
        }
    };
};
