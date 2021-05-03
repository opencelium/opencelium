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
 * fetch settings
 * @returns {{type: string}}
 */
const fetchWidgetSettings = () => {
    return {
        type: DashboardAction.FETCH_WIDGETSETTINGS
    };
};

/**
 * fetch settings fulfilled
 * @param settings
 * @returns {{type: string, payload: {}}}
 */
const fetchWidgetSettingsFulfilled = (settings) => {
    return{
        type: DashboardAction.FETCH_WIDGETSETTINGS_FULFILLED,
        payload: settings
    };
};

/**
 * fetch settings rejected
 * @param error
 * @returns {*}
 */
const fetchWidgetSettingsRejected = (error) => {
    return Rx.Observable.of({
        type: DashboardAction.FETCH_WIDGETSETTINGS_REJECTED,
        payload: error
    });
};
/**
 * fetch widgets
 * @returns {{type: string}}
 */
const fetchWidgets = () => {
    return {
        type: DashboardAction.FETCH_WIDGETS
    };
};

/**
 * fetch widgets fulfilled
 * @param widgets
 * @returns {{type: string, payload: {}}}
 */
const fetchWidgetsFulfilled = (widgets) => {
    return{
        type: DashboardAction.FETCH_WIDGETS_FULFILLED,
        payload: widgets
    };
};

/**
 * fetch widgets rejected
 * @param error
 * @returns {*}
 */
const fetchWidgetsRejected = (error) => {
    return Rx.Observable.of({
        type: DashboardAction.FETCH_WIDGETS_REJECTED,
        payload: error
    });
};

export{
    fetchWidgetSettings,
    fetchWidgetSettingsFulfilled,
    fetchWidgetSettingsRejected,
    fetchWidgets,
    fetchWidgetsFulfilled,
    fetchWidgetsRejected,
};