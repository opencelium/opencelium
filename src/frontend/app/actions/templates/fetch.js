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

import {TemplatesAction} from "@utils/actions";


/**
 * fetch all templates
 * @param settings = {from: object, to: object, background: bool}
 *      from - from connector
 *      to - to connector
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, settings: {}}}
 */
const fetchTemplates = (settings = {}) => {
    return {
        type: TemplatesAction.FETCH_TEMPLATES,
        settings,
    };
};


/**
 * fetch all templates fulfilled
 * @param templates
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: [], settings: {}}}
 */
const fetchTemplatesFulfilled = (templates, settings = {}) => {
    return {
        type: TemplatesAction.FETCH_TEMPLATES_FULFILLED,
        payload: templates,
        settings,
    };
};

/**
 * fetch all templates rejected
 * @param error
 * @returns {*}
 */
const fetchTemplatesRejected = (error) => {
    return Rx.Observable.of({
        type: TemplatesAction.FETCH_TEMPLATES_REJECTED,
        payload: error
    });
};

/**
 * fetch all templates canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchTemplatesCanceled = (message) => {
    return {
        type: TemplatesAction.FETCH_TEMPLATES_CANCELED,
        payload: message
    };
};
/**
 * fetch all templates
 * @param template
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, settings: {}}}
 */
const exportTemplate = (template, settings = {}) => {
    return {
        type: TemplatesAction.EXPORT_TEMPLATE,
        payload: template,
        settings,
    };
};


/**
 * fetch all templates fulfilled
 * @param templates
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: [], settings: {}}}
 */
const exportTemplateFulfilled = (template, settings = {}) => {
    return {
        type: TemplatesAction.EXPORT_TEMPLATE_FULFILLED,
        payload: template,
        settings,
    };
};

/**
 * fetch all templates rejected
 * @param error
 * @returns {*}
 */
const exportTemplateRejected = (error) => {
    return Rx.Observable.of({
        type: TemplatesAction.EXPORT_TEMPLATE_REJECTED,
        payload: error
    });
};

/**
 * fetch all templates canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const exportTemplateCanceled = (message) => {
    return {
        type: TemplatesAction.EXPORT_TEMPLATE_CANCELED,
        payload: message
    };
};


export{
    fetchTemplates,
    fetchTemplatesFulfilled,
    fetchTemplatesRejected,
    fetchTemplatesCanceled,
    exportTemplate,
    exportTemplateFulfilled,
    exportTemplateRejected,
    exportTemplateCanceled,
};