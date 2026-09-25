import { errorBus } from '../errorBus'
import {showApiError} from "@shared/api/handleApiError.ts";

export function initApiErrorNotifySubscriber() {
    return errorBus.subscribe((error) => {
        showApiError({
            errorSource: error,
            message: error.serverMessage,
            request: error.request,
            transKey: error?.messageKey,
            group: 'api',
            durationSec: error.durationSec,
        })
    })
}
