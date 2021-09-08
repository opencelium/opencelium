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

import { TemplatesAction } from '@utils/actions';


/**
 * delete template
 * @param template
 * @returns {{type: string, payload: {}}}
 */
const deleteTemplate = (template) => {
    return {
        type: TemplatesAction.DELETE_TEMPLATE,
        payload: template,
    };
};

/**
 * delete template fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const deleteTemplateFulfilled = (status) => {
    return {
        type: TemplatesAction.DELETE_TEMPLATE_FULFILLED,
        payload: status,
    };
};

/**
 * delete template rejected
 * @param error
 * @returns {promise}
 */
const deleteTemplateRejected = (error) => {
    return Rx.Observable.of({
        type: TemplatesAction.DELETE_TEMPLATE_REJECTED,
        payload: error
    });
};

/**
 * delete templates
 * @param templates
 * @returns {{type: string, payload: {}}}
 */
const deleteTemplates = (templates) => {
    return {
        type: TemplatesAction.DELETE_TEMPLATES,
        payload: templates,
    };
};

/**
 * delete templates fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const deleteTemplatesFulfilled = (status) => {
    return {
        type: TemplatesAction.DELETE_TEMPLATES_FULFILLED,
        payload: status,
    };
};

/**
 * delete templates rejected
 * @param error
 * @returns {promise}
 */
const deleteTemplatesRejected = (error) => {
    return Rx.Observable.of({
        type: TemplatesAction.DELETE_TEMPLATES_REJECTED,
        payload: error
    });
};


export{
    deleteTemplate,
    deleteTemplateFulfilled,
    deleteTemplateRejected,
    deleteTemplates,
    deleteTemplatesFulfilled,
    deleteTemplatesRejected,
};