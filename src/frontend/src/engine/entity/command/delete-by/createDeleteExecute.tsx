import {genericApi} from "@shared/api/genericApi.ts";
import {store} from "@app/store/store.ts";
import {i18n} from "@shared/i18n/config/i18n.ts";
import {message} from "antd";

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

        try {
            await store.dispatch(
                genericApi.endpoints.deleteEntity.initiate({ url: deleteUrl })
            ).unwrap();

            // optional post-delete logic
            if (by.afterDelete) {
                await by.afterDelete(value, ctx);
            }
            ctx.setInputValue?.(
                `delete ${def.name} by ${by.field} `
            );
            message.success(successTrans('api.deleted'));

        } catch (e) {
            console.error(e);
            ctx.notify(`Failed to delete ${def.name}`, 'error');
        }
    };
};
