import {i18n} from "@shared/i18n/config/i18n";
import {notifyError} from "@shared/ui/feedback/notifyError";
import {describeApiRequest} from "@shared/api/describeApiRequest";
import type {ApiRequestDescriptor} from "@shared/errors/types";

type ErrorGroup = 'api';

type ApiError = {
    errorSource: any,
    group?: ErrorGroup,
    namespace?: string,
    transKey?: string;
    /** Untranslated text the API replied with; the toast's reason line. */
    message?: string;
    /** The call that failed, when there was one; becomes the toast's heading. */
    request?: ApiRequestDescriptor;
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
    }) : undefined;

    // The reason line: what the API replied, since per-status copy ("An unexpected
    // error occurred") never says why. A backend code can double as a translation key
    // (see normalizeError's 500 branch) — where this project has copy for that code,
    // the copy is what the bare code means, so it wins over echoing the code. With no
    // reply to show, the translated copy is the only reason available.
    const codeHasOwnCopy = !!error.message
        && transKey.endsWith(`.${error.message}`)
        && i18n.exists(transKey, { ns: namespace });
    const text = codeHasOwnCopy ? translated : error.message ?? translated;

    // Heading = what we were doing, reason = what came back. Without a request to
    // name (hand-emitted errors, direct callers) the reason stands on its own under
    // the generic "Error" heading, as before.
    const headline = error.request ? describeApiRequest(error.request) : undefined;

    notifyError(text || `Unknown error: ${JSON.stringify(error)}`, error.durationSec, headline);
};
