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

export {
    updateTemplates,
    updateTemplatesFulfilled,
    updateTemplatesRejected,
    updateInvokers,
    updateInvokersFulfilled,
    updateInvokersRejected,
};