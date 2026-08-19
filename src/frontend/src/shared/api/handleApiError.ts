import {i18n} from "@shared/i18n/config/i18n.ts";
import {notifyError} from "@shared/ui/feedback/notifyError";

type ErrorGroup = 'api';

type ApiError = {
    errorSource: any,
    group?: ErrorGroup,
    namespace?: string,
    transKey?: string;
    message?: string;
    durationSec?: number;
};

export const showApiError = (error: ApiError) => {
    let namespace: any = error.namespace;
    let transKey: any = error.transKey;
    if (!namespace && error?.group) {
        switch (error.group) {
            case "api":
                namespace = 'error';
                transKey = `api.${transKey}`;
                break;
            default:
                notifyError('Unknown error group');
                return;
        }
    }
    const t = i18n.getFixedT(i18n.language, namespace);
    const defaultKey = transKey.replace(/[^.]+$/, "default");

    const translated = transKey ? t(transKey, {
        defaultValue: i18n.exists(defaultKey, { ns: namespace })
            ? t(defaultKey)
            : undefined,
    }) : error.message;
    if (!translated) {
        notifyError(`Unknown error: ${JSON.stringify(error)}`, error.durationSec);
    } else {
        notifyError(translated, error.durationSec);
    }
};
