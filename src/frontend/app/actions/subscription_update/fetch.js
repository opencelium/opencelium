import {SubscriptionUpdate} from "@utils/actions";
import Rx from "rxjs";

/**
 * fetch subscription update
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const fetchSubscriptionUpdate = (settings = {background: false}) => {
    return {
        type: SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE,
        settings,
    };
};

/**
 * fetch subscription update fulfilled
 * @param app = application
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const fetchSubscriptionUpdateFulfilled = (app, settings = {background: false}) => {
    return {
        type: SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE_FULFILLED,
        payload: app,
        settings: {...settings, hasCloseButton: true},
    };
};

/**
 * fetch subscription update rejected
 * @param error
 * @returns {promise}
 */
const fetchSubscriptionUpdateRejected = (error) => {
    return Rx.Observable.of({
        type: SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE_REJECTED,
        payload: error
    });
};

export {
    fetchSubscriptionUpdate,
    fetchSubscriptionUpdateFulfilled,
    fetchSubscriptionUpdateRejected,
}