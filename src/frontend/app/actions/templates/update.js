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
import {ConnectionsAction, TemplatesAction} from "@utils/actions";


/**
 * convert a template for connection
 * @param template
 * @returns {{type: string, payload: {}}}
 */
const convertTemplate = (template) => {
    return {
        type: TemplatesAction.CONVERT_TEMPLATE,
        payload: Object.assign({}, template),
    };
};

/**
 * convert a template for connection fulfilled
 * @param template
 * @returns {{type: string, payload: {}}}
 */
const convertTemplateFulfilled = (template) => {
    return {
        type: TemplatesAction.CONVERT_TEMPLATE_FULFILLED,
        payload: template,
    };
};

/**
 * convert a template for connection rejected
 * @param error
 * @returns {promise}
 */
const convertTemplateRejected = (error) => {
    return {
        type: TemplatesAction.CONVERT_TEMPLATE_REJECTED,
        payload: error
    };
};


/**
 * update templates for connection
 * @param templates
 * @returns {{type: string, payload: {}}}
 */
const convertTemplates = (templates) => {
    return {
        type: TemplatesAction.CONVERT_TEMPLATES,
        payload: templates,
    };
};

/**
 * update templates for connection fulfilled
 * @param templates
 * @returns {{type: string, payload: {}}}
 */
const convertTemplatesFulfilled = (templates) => {
    return {
        type: TemplatesAction.CONVERT_TEMPLATES_FULFILLED,
        payload: templates,
    };
};

/**
 * update templates for connection rejected
 * @param error
 * @returns {promise}
 */
const convertTemplatesRejected = (error) => {
    return {
        type: TemplatesAction.CONVERT_TEMPLATES_REJECTED,
        payload: error
    };
};


/**
 * update template
 * @param template
 * @returns {{type: string, payload: {}}}
 */
const updateTemplate = (template) => {
    return {
        type: TemplatesAction.UPDATE_TEMPLATE,
        payload: template,
    };
};

/**
 * update template fulfilled
 * @param template
 * @returns {{type: string, payload: {}}}
 */
const updateTemplateFulfilled = (template) => {
    return {
        type: TemplatesAction.UPDATE_TEMPLATE_FULFILLED,
        payload: template,
    };
};

/**
 * update template rejected
 * @param error
 * @returns {promise}
 */
const updateTemplateRejected = (error) => {
    return Rx.Observable.of({
        type: TemplatesAction.UPDATE_TEMPLATE_REJECTED,
        payload: error
    });
};

export {
    convertTemplate,
    convertTemplateFulfilled,
    convertTemplateRejected,
    convertTemplates,
    convertTemplatesFulfilled,
    convertTemplatesRejected,
    updateTemplate,
    updateTemplateFulfilled,
    updateTemplateRejected,
};