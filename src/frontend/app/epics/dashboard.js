import Rx from 'rxjs/Rx';
import {DashboardAction} from "@utils/actions";
import {doRequest} from "@utils/auth";
import {fetchDashboardSettingsFulfilled, fetchDashboardSettingsRejected} from "@actions/dashboard/fetch";
import {updateDashboardSettingsFulfilled, updateDashboardSettingsRejected} from "@actions/dashboard/update";
import {INITIAL_LAYOUT} from "@components/content/dashboard/view/settings";
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
const fetchDashboardSettingsEpic = (action$, store) => {
    return action$.ofType(DashboardAction.FETCH_WIDGETSETTINGS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            return Rx.Observable.of(fetchDashboardSettingsFulfilled({widgetSettings: INITIAL_LAYOUT}));
            /*return doRequest({url},{
                success: fetchDashboardSettingsFulfilled,
                reject: fetchDashboardSettingsRejected,
            });*/
        });
};

/**
 * update settings
 */
const updateWidgetSettingsEpic = (action$, store) => {
    return action$.ofType(DashboardAction.UPDATE_WIDGETSETTINGS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return Rx.Observable.of(updateDashboardSettingsFulfilled(action.payload));/*
            return doRequest({url, method: API_METHOD.POST, data: action.payload},{
                success: updateDashboardSettingsFulfilled,
                reject: updateDashboardSettingsRejected,},
            );*/
        });
};

export {
    fetchDashboardSettingsEpic,
    updateWidgetSettingsEpic,
};