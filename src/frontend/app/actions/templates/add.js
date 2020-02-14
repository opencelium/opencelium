/*
 * Copyright (C) <2020>  <becon GmbH>
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
import {TemplatesAction} from "../../utils/actions";


/**
 * save a template for connection
 * @param template
 * @returns {{type: string, payload: {}}}
 */
const addTemplate = (template) => {
    return {
        type: TemplatesAction.ADD_TEMPLATE,
        payload: Object.assign({}, template),
    };
};

/**
 * save a template for connection fulfilled
 * @param template
 * @returns {{type: string, payload: {}}}
 */
const addTemplateFulfilled = (template) => {
    return {
        type: TemplatesAction.ADD_TEMPLATE_FULFILLED,
        payload: template,
    };
};

/**
 * save a template for connection rejected
 * @param error
 * @returns {promise}
 */
const addTemplateRejected = (error) => {
    return Rx.Observable.of({
        type: TemplatesAction.ADD_TEMPLATE_REJECTED,
        payload: error
    });
};

/**
 * import a template for connection
 * @param template
 * @returns {{type: string, payload: {}}}
 */
const importTemplate = (template) => {
    return {
        type: TemplatesAction.IMPORT_TEMPLATE,
        payload: Object.assign({}, template),
    };
};

/**
 * import a template for connection fulfilled
 * @param template
 * @returns {{type: string, payload: {}}}
 */
const importTemplateFulfilled = (template) => {
    return {
        type: TemplatesAction.IMPORT_TEMPLATE_FULFILLED,
        payload: template,
    };
};

/**
 * import a template for connection rejected
 * @param error
 * @returns {promise}
 */
const importTemplateRejected = (error) => {
    return Rx.Observable.of({
        type: TemplatesAction.IMPORT_TEMPLATE_REJECTED,
        payload: error
    });
};


export {
    addTemplate,
    addTemplateFulfilled,
    addTemplateRejected,
    importTemplate,
    importTemplateFulfilled,
    importTemplateRejected,
};