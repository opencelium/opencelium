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