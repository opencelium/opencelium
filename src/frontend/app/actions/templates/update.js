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
import {TemplatesAction} from "@utils/actions";


/**
 * update a template for connection
 * @param template
 * @returns {{type: string, payload: {}}}
 */
const updateTemplate = (template) => {
    return {
        type: TemplatesAction.UPDATE_TEMPLATE,
        payload: Object.assign({}, template),
    };
};

/**
 * update a template for connection fulfilled
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
 * update a template for connection rejected
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
    updateTemplate,
    updateTemplateFulfilled,
    updateTemplateRejected,
};