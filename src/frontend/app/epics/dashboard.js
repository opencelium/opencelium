/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

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
            let authUser = store.getState('auth').get('auth').get('authUser');
            let url = `widget_setting`;
            return doRequest({url, method: API_METHOD.POST, data: {userId: authUser.userId, widgetSettings:action.payload.layout}},{
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