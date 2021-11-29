import {SubscriptionUpdate} from "@utils/actions";
import {doRequest} from "@utils/auth";
import {
    doSubscriptionUpdateFulfilled, doSubscriptionUpdateRejected,
    fetchSubscriptionUpdateFulfilled,
    fetchSubscriptionUpdateRejected
} from "@actions/subscription_update/fetch";
import {getLS} from "@utils/LocalStorage";

const urlPrefix = 'assistant/subscription/';

/**
 * fetch update application version
 */
const fetchSubscriptionUpdateEpic = (action$, store) => {
    return action$.ofType(SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}repo/diff/files`;
            return doRequest({url},{
                success: (data) => fetchSubscriptionUpdateFulfilled(data, {...action.settings}),
                reject: fetchSubscriptionUpdateRejected,
            });
        });
};
/**
 * do update application version
 */
const doSubscriptionUpdateEpic = (action$, store) => {
    return action$.ofType(SubscriptionUpdate.DO_SUBSCRIPTIONUPDATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}repo/update`;
            return doRequest({url},{
                success: (data) => doSubscriptionUpdateFulfilled({...action.settings}),
                reject: doSubscriptionUpdateRejected,
            });
        });
};

export {
    fetchSubscriptionUpdateEpic,
    doSubscriptionUpdateEpic,
}