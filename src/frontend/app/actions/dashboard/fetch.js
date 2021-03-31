import {DashboardAction} from "@utils/actions";
import Rx from "rxjs";

/**
 * fetch settings
 * @returns {{type: string}}
 */
const fetchDashboardSettings = () => {
    return {
        type: DashboardAction.FETCH_WIDGETSETTINGS
    };
};

/**
 * fetch settings fulfilled
 * @param settings
 * @returns {{type: string, payload: {}}}
 */
const fetchDashboardSettingsFulfilled = (settings) => {
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
const fetchDashboardSettingsRejected = (error) => {
    return Rx.Observable.of({
        type: DashboardAction.FETCH_WIDGETSETTINGS_REJECTED,
        payload: error
    });
};

export{
    fetchDashboardSettings,
    fetchDashboardSettingsFulfilled,
    fetchDashboardSettingsRejected,
};