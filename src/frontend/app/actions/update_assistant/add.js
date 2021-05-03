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

import Rx from 'rxjs/Rx';

import { UpdateAssistantAction } from '@utils/actions';


/**
 * create a new version
 * @param version
 * @returns {{type: string, payload: {}}}
 */
const uploadVersion = (version) => {
    return {
        type: UpdateAssistantAction.UPLOAD_VERSION,
        payload: version,
    };
};

/**
 * create a new version fulfilled
 * @param version
 * @returns {{type: string, payload: {}}}
 */
const uploadVersionFulfilled = (version) => {
    return {
        type: UpdateAssistantAction.UPLOAD_VERSION_FULFILLED,
        payload: version,
    };
};

/**
 * create a new version rejected
 * @param error
 * @returns {*}
 */
const uploadVersionRejected = (error) => {
    return Rx.Observable.of({
        type: UpdateAssistantAction.UPLOAD_VERSION_REJECTED,
        payload: error
    });
};

/**
 * add logs after convert templates
 * @param logs
 * @returns {{type: string, payload: {}}}
 */
const addConvertTemplatesLogs = (logs) => {
    return {
        type: UpdateAssistantAction.ADD_CONVERTTEMPLATESLOGS,
        payload: logs,
    };
};

/**
 * add logs after convert templates fulfilled
 * @param response
 * @returns {{type: string, payload: {}}}
 */
const addConvertTemplatesLogsFulfilled = (response) => {
    return {
        type: UpdateAssistantAction.ADD_CONVERTTEMPLATESLOGS_FULFILLED,
        payload: response,
    };
};

/**
 * add logs after convert templates rejected
 * @param error
 * @returns {*}
 */
const addConvertTemplatesLogsRejected = (error) => {
    return Rx.Observable.of({
        type: UpdateAssistantAction.ADD_CONVERTTEMPLATESLOGS_REJECTED,
        payload: error
    });
};

/**
 * add logs after convert invokers
 * @param logs
 * @returns {{type: string, payload: {}}}
 */
const addConvertInvokersLogs = (logs) => {
    return {
        type: UpdateAssistantAction.ADD_CONVERTINVOKERSLOGS,
        payload: logs,
    };
};

/**
 * add logs after convert invokers fulfilled
 * @param response
 * @returns {{type: string, payload: {}}}
 */
const addConvertInvokersLogsFulfilled = (response) => {
    return {
        type: UpdateAssistantAction.ADD_CONVERTINVOKERSLOGS_FULFILLED,
        payload: response,
    };
};

/**
 * add logs after convert invokers rejected
 * @param error
 * @returns {*}
 */
const addConvertInvokersLogsRejected = (error) => {
    return Rx.Observable.of({
        type: UpdateAssistantAction.ADD_CONVERTINVOKERSLOGS_REJECTED,
        payload: error
    });
};

/**
 * add logs after convert connections
 * @param logs
 * @returns {{type: string, payload: {}}}
 */
const addConvertConnectionsLogs = (logs) => {
    return {
        type: UpdateAssistantAction.ADD_CONVERTCONNECTIONSLOGS,
        payload: logs,
    };
};

/**
 * add logs after convert connections fulfilled
 * @param response
 * @returns {{type: string, payload: {}}}
 */
const addConvertConnectionsLogsFulfilled = (response) => {
    return {
        type: UpdateAssistantAction.ADD_CONVERTCONNECTIONSLOGS_FULFILLED,
        payload: response,
    };
};

/**
 * add logs after convert connections rejected
 * @param error
 * @returns {*}
 */
const addConvertConnectionsLogsRejected = (error) => {
    return Rx.Observable.of({
        type: UpdateAssistantAction.ADD_CONVERTCONNECTIONSLOGS_REJECTED,
        payload: error
    });
};


export{
    uploadVersion,
    uploadVersionFulfilled,
    uploadVersionRejected,
    addConvertTemplatesLogs,
    addConvertTemplatesLogsFulfilled,
    addConvertTemplatesLogsRejected,
    addConvertInvokersLogs,
    addConvertInvokersLogsFulfilled,
    addConvertInvokersLogsRejected,
    addConvertConnectionsLogs,
    addConvertConnectionsLogsFulfilled,
    addConvertConnectionsLogsRejected,
};