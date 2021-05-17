import {UpdateAssistantAction} from "@utils/actions";
import Rx from "rxjs";

/**
 * check reset files
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const checkResetFiles = (settings = {background: false}) => {
    return {
        type: UpdateAssistantAction.CHECK_RESETFILES,
        settings,
    };
};

/**
 * check reset files fulfilled
 * @param response - exist or not
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const checkResetFilesFulfilled = (response, settings = {background: false}) => {
    return {
        type: UpdateAssistantAction.CHECK_RESETFILES_FULFILLED,
        payload: response,
        settings: {...settings, hasCloseButton: true},
    };
};

/**
 * check reset files rejected
 * @param error
 * @returns {promise}
 */
const checkResetFilesRejected = (error) => {
    return Rx.Observable.of({
        type: UpdateAssistantAction.CHECK_RESETFILES_REJECTED,
        payload: error
    });
};

export {
    checkResetFiles,
    checkResetFilesFulfilled,
    checkResetFilesRejected,
};