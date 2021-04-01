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