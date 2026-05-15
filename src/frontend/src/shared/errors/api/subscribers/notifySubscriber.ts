import { errorBus } from '../errorBus'
import {showApiError} from "@shared/api/handleApiError.ts";

export function initApiErrorNotifySubscriber() {
    return errorBus.subscribe((error) => {
        showApiError({
            errorSource: error,
            message: error.details?.message,
            transKey: error?.messageKey,
            group: 'api',
        })
    })
}
