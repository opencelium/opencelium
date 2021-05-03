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
import Rx from "rxjs";

/**
 * update settings
 * @returns {{type: string}}
 */
const updateWidgetSettings = (settings) => {
    return {
        type: DashboardAction.UPDATE_WIDGETSETTINGS,
        payload: settings,
    };
};

/**
 * update settings fulfilled
 * @param settings
 * @returns {{type: string, payload: {}}}
 */
const updateWidgetSettingsFulfilled = (settings) => {
    return{
        type: DashboardAction.UPDATE_WIDGETSETTINGS_FULFILLED,
        payload: settings,
    };
};

/**
 * update settings rejected
 * @param error
 * @returns {*}
 */
const updateWidgetSettingsRejected = (error) => {
    return Rx.Observable.of({
        type: DashboardAction.UPDATE_WIDGETSETTINGS_REJECTED,
        payload: error
    });
};

export{
    updateWidgetSettings,
    updateWidgetSettingsFulfilled,
    updateWidgetSettingsRejected,
};