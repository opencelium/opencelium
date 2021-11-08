import {SubscriptionUpdate} from "@utils/actions";
import {doRequest} from "@utils/auth";
import {fetchUpdateAppVersionFulfilled, fetchUpdateAppVersionRejected} from "@actions/update_assistant/fetch";
import {fetchSubscriptionUpdateFulfilled, fetchSubscriptionUpdateRejected} from "@actions/subscription_update/fetch";

const urlPrefix = 'assistant/oc';

/**
 * fetch update application version
 */
const fetchSubscriptionUpdateEpic = (action$, store) => {
    return action$.ofType(SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/version`;
            const currentAppVersion = action.settings.currentAppVersion;
            return doRequest({url},{
                success: (data) => fetchSubscriptionUpdateFulfilled(data, {...action.settings, background: currentAppVersion === data.version ? true : action.settings.background}),
                reject: fetchSubscriptionUpdateRejected,
            });
        });
};

export {
    fetchSubscriptionUpdateEpic,
}