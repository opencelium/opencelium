import {DashboardAction} from "@utils/actions";
import {doRequest} from "@utils/auth";
import {
    fetchWidgetSettingsFulfilled, fetchWidgetSettingsRejected,
    fetchWidgetsFulfilled, fetchWidgetsRejected,
} from "@actions/dashboard/fetch";
import {updateWidgetSettingsFulfilled, updateWidgetSettingsRejected} from "@actions/dashboard/update";
import {API_METHOD} from "@utils/constants/app";


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
            let authUser = store.getState('auth').get('auth').get('authUser');
            let url = `widget_setting/user/${authUser.userId}`;
            return doRequest({url},{
                success: fetchWidgetSettingsFulfilled,
                reject: fetchWidgetSettingsRejected,
            });
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
            let url = `widget/all`;
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
            let url = `widget_setting`;
            return doRequest({url, method: API_METHOD.POST, data: action.payload.layout},{
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