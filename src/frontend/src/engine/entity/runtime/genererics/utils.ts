import {apiExecutor} from "@shared/api/apiExecutor.ts";

export const executeAction = async (name: string, ctx: any, entity: any) => {
    const action = entity.api.actions?.[name];
    if (!action) throw new Error(`Action "${name}" not found`);

    if (action.condition && !action.condition(ctx)) {
        return;
    }

    if (action.execute) {
        return action.execute(ctx);
    }

    const url =
        typeof action.url === 'function'
            ? action.url(ctx)
            : action.url;

    const body = action.mapBody
        ? action.mapBody(ctx)
        : ctx.payload;

    const headers = {
        'Content-Type': 'application/json',
        ...(entity.api.getHeaders?.({ mode: ctx.mode }) || {}),
        ...(action.mapHeaders?.(ctx) || {}),
    };


    return apiExecutor({
        url,
        method: action.method || 'POST',
        body,
        options: {
            headers,
            ignoreError: action.ignoreError,
        },
    });
};

export const runStage = async (
    actions: string[] | undefined,
    ctx: any,
    entity: any
) => {
    if (!actions?.length) return;

    for (const actionName of actions) {
        await executeAction(actionName, ctx, entity);
    }
};
