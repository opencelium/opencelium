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

import {UpdateAssistantAction} from "@utils/actions";

/**
 * update templates for update assistant
 * @param templates
 * @returns {{type: string, payload: {}}}
 */
const updateTemplates = (templates) => {
    return {
        type: UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT,
        payload: templates,
    };
};

/**
 * update templates for update assistant fulfilled
 * @param templates
 * @returns {{type: string, payload: {}}}
 */
const updateTemplatesFulfilled = (templates) => {
    return {
        type: UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT_FULFILLED,
        payload: templates,
    };
};

/**
 * update templates for update assistant rejected
 * @param error
 * @returns {promise}
 */
const updateTemplatesRejected = (error) => {
    return {
        type: UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT_REJECTED,
        payload: error
    };
};

/**
 * update invokers for update assistant
 * @param invokers
 * @returns {{type: string, payload: {}}}
 */
const updateInvokers = (invokers) => {
    return {
        type: UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT,
        payload: invokers,
    };
};

/**
 * update invokers for update assistant fulfilled
 * @param invokers
 * @returns {{type: string, payload: {}}}
 */
const updateInvokersFulfilled = (invokers) => {
    return {
        type: UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT_FULFILLED,
        payload: invokers,
    };
};

/**
 * update invokers for update assistant rejected
 * @param error
 * @returns {promise}
 */
const updateInvokersRejected = (error) => {
    return {
        type: UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT_REJECTED,
        payload: error
    };
};

/**
 * update connections for update assistant
 * @param connections
 * @returns {{type: string, payload: {}}}
 */
const updateConnections = (connections) => {
    return {
        type: UpdateAssistantAction.UPDATE_CONNECTIONSFORASSISTANT,
        payload: connections,
    };
};

/**
 * update connections for update assistant fulfilled
 * @param connections
 * @returns {{type: string, payload: {}}}
 */
const updateConnectionsFulfilled = (connections) => {
    return {
        type: UpdateAssistantAction.UPDATE_CONNECTIONSFORASSISTANT_FULFILLED,
        payload: connections,
    };
};

/**
 * update connections for update assistant rejected
 * @param error
 * @returns {promise}
 */
const updateConnectionsRejected = (error) => {
    return {
        type: UpdateAssistantAction.UPDATE_CONNECTIONSFORASSISTANT_REJECTED,
        payload: error
    };
};

export {
    updateTemplates,
    updateTemplatesFulfilled,
    updateTemplatesRejected,
    updateInvokers,
    updateInvokersFulfilled,
    updateInvokersRejected,
    updateConnections,
    updateConnectionsFulfilled,
    updateConnectionsRejected,
};