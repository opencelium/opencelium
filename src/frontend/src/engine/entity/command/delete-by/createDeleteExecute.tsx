import type { EntityDefinition } from '@/engine/entity/EntityDefinition';
import type { DeleteByConfig, GeneralCommandType } from '../types';
import type { CommandExecutionContext } from '@shared/command/types';
import { listLocation } from '@shared/navigation/listLocation';
import {genericApi} from "@shared/api/genericApi.ts";
import {store} from "@app/store/store.ts";
import {i18n} from "@shared/i18n/config/i18n.ts";
import {message} from "antd";

// True when the browser is currently sitting on the view/update page of the
// exact record being deleted — that page's own query would otherwise refetch
// (mutations broadly invalidate the 'Entity' tag) and 404 against a record
// that no longer exists.
const isViewingRecord = (def: EntityDefinition, resolvedId: string): boolean => {
    const routeName = def.routes?.find((r) => r.entityRouteName)?.entityRouteName ?? def.name;
    const currentPath = window.location.pathname;
    return (
        currentPath === `/${routeName}/update/${resolvedId}` ||
        currentPath === `/${routeName}/view/${resolvedId}`
    );
};

export const createDeleteExecute = ({ def, name, config, by }: GeneralCommandType & { by: DeleteByConfig }) => {
    return async (args: { identifier: string }, ctx: CommandExecutionContext) => {

        // The command palette's literal token for this entity — normally def.name,
        // but overridable via commandName (createEntityCommands) when the
        // user-facing word should differ from the registry key (see
        // connectionTemplate.definition.tsx: registry name 'connection-template',
        // typed command word 'workflow-template'). The re-prefilled input text
        // below must echo the word the user actually typed, not the registry key.
        const commandWord = name ?? def.name;

        const successTrans = i18n.getFixedT(i18n.language, 'success');
        const commonTrans = i18n.getFixedT(i18n.language, 'common');
        if (config?.overrides?.delete) {
            return config.overrides.delete(def, ctx);
        }

        if (!def.api) return;
        const value = args.identifier;

        const confirmMessage =
            by.confirmMessage?.(value, def) ??
            commonTrans('question.confirmation.delete', {entityName: def.name, field: by.field, value});

        const confirmed = await ctx.confirm(confirmMessage);
        if (!confirmed) {
            ctx.setInputValue?.(
                `delete ${commandWord} by ${by.field} `
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
                const listRoute = def.routes?.find(route => route.type === 'list');
                ctx.navigate(listLocation(listRoute?.path ?? `/${listRoute?.entityRouteName ?? def.name}`));
            } else {
                ctx.setInputValue?.(
                    `delete ${commandWord} by ${by.field} `
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
