import {DashboardAction} from "@utils/actions";
import Rx from "rxjs";

/**
 * update settings
 * @returns {{type: string}}
 */
const updateDashboardSettings = (settings) => {
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
const updateDashboardSettingsFulfilled = (settings) => {
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
const updateDashboardSettingsRejected = (error) => {
    return Rx.Observable.of({
        type: DashboardAction.UPDATE_WIDGETSETTINGS_REJECTED,
        payload: error
    });
};

export{
    updateDashboardSettings,
    updateDashboardSettingsFulfilled,
    updateDashboardSettingsRejected,
};