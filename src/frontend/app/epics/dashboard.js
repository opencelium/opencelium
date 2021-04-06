import Rx from 'rxjs/Rx';
import {DashboardAction} from "@utils/actions";
import {doRequest} from "@utils/auth";
import {
    fetchWidgetSettingsFulfilled, fetchWidgetSettingsRejected,
    fetchWidgetsFulfilled, fetchWidgetsRejected,
} from "@actions/dashboard/fetch";
import {updateWidgetSettingsFulfilled, updateWidgetSettingsRejected} from "@actions/dashboard/update";
import {isArray} from "@utils/app";
import {API_METHOD} from "@utils/constants/app";

/**
 * main url for invokers
 */
const urlPrefix = 'dashboard';

/**
 * fetch settings
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchWidgetSettingsEpic = (action$, store) => {
    return action$.ofType(DashboardAction.FETCH_WIDGETSETTINGS)
        .debounceTime(500)
        .mergeMap((action) => {
            let widgetSettings = store.getState('auth').get('auth').get('authUser').widgetSettings;
            if(isArray(widgetSettings)){
                return Rx.Observable.of(fetchWidgetSettingsFulfilled({widgetSettings}))
            } else{
                return fetchWidgetSettingsRejected({widgetSettings});
            }
        });
};

/**
 * fetch widgets
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchWidgetsEpic = (action$, store) => {
    return action$.ofType(DashboardAction.FETCH_WIDGETS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `widget_setting/all`;
            return doRequest({url},{
                success: fetchWidgetsFulfilled,
                reject: fetchWidgetsRejected,
            });
        });
};

/**
 * update settings
 */
const updateWidgetSettingsEpic = (action$, store) => {
    return action$.ofType(DashboardAction.UPDATE_WIDGETSETTINGS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `widget_setting/all`;
            return doRequest({url, method: API_METHOD.POST, data: action.payload},{
                success: updateWidgetSettingsFulfilled,
                reject: updateWidgetSettingsRejected,},
            );
        });
};

export {
    fetchWidgetSettingsEpic,
    fetchWidgetsEpic,
    updateWidgetSettingsEpic,
};