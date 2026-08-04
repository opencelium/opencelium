import {apiExecutor} from "@shared/api/apiExecutor.ts";

export const executeAction = async (name: string, ctx: any, entity: any) => {
    const action = entity.api.actions?.[name];
    if (!action) throw new Error(`Action "${name}" not found`);

    if (action.condition && !action.condition(ctx)) {
        return;
    }

    if ('execute' in action) {
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

export type StageActionError = {
    actionName: string;
    error: unknown;
    errorMessageKey?: string;
};

export type StageResult = {
    errors: StageActionError[];
};

export const runStage = async (
    actions: string[] | undefined,
    ctx: any,
    entity: any,
): Promise<StageResult> => {
    const errors: StageActionError[] = [];
    if (!actions?.length) return { errors };

    for (const actionName of actions) {
        const action = entity.api?.actions?.[actionName];
        try {
            await executeAction(actionName, ctx, entity);
        } catch (error) {
            if (action?.bestEffort) {
                console.error(`[lifecycle] best-effort action "${actionName}" failed:`, error);
                errors.push({ actionName, error, errorMessageKey: action.errorMessageKey });
                continue;
            }
            throw error;
        }
    }

    return { errors };
};
