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

import {List, fromJS} from 'immutable';

import {SchedulesAction, TemplatesAction} from '../utils/actions';
import {isArray} from "../utils/app";
import {API_REQUEST_STATE} from "../utils/constants/app";


const initialState = fromJS({
    addingTemplate: API_REQUEST_STATE.INITIAL,
    updatingTemplate: API_REQUEST_STATE.INITIAL,
    fetchingTemplates: API_REQUEST_STATE.INITIAL,
    deletingTemplate: API_REQUEST_STATE.INITIAL,
    exportingTemplate: API_REQUEST_STATE.INITIAL,
    importingTemplate: API_REQUEST_STATE.INITIAL,
    template: {},
    exportedTemplate: {},
    templates: List([]),
    error: null,
    message: {},
    notificationData: {},
});

let templates = [];
let index = 0;

/**
 * redux reducer for templates
 */
const reducer = (state = initialState, action) => {
    templates = state.get('templates');
    switch (action.type) {
        case TemplatesAction.ADD_TEMPLATE:
            return state.set('addingTemplate', API_REQUEST_STATE.START).set('error', null);
        case TemplatesAction.ADD_TEMPLATE_FULFILLED:
            return state.set('addingTemplate', API_REQUEST_STATE.FINISH).set('templates', templates.set(templates.size, action.payload));
        case TemplatesAction.ADD_TEMPLATE_REJECTED:
            return state.set('addingTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case TemplatesAction.UPDATE_TEMPLATE:
            return state.set('updatingTemplate', true).set('isRejected', false).set('isCanceled', false).set('error', null);
        case TemplatesAction.UPDATE_TEMPLATE_FULFILLED:
            index = templates.findIndex(function (template) {
                return template.templateId === action.payload.oldTemplate.templateId;
            });
            if(index >= 0) {
                templates = templates.set(index, action.payload.newTemplate);
            }
            return state.set('updatingTemplate', false).set('templates', templates);
        case TemplatesAction.UPDATE_TEMPLATE_REJECTED:
            return state.set('updatingTemplate', false).set('isRejected', true).set('error', action.payload);
        case TemplatesAction.FETCH_TEMPLATES:
            return state.set('fetchingTemplates', API_REQUEST_STATE.START).set('error', null);
        case TemplatesAction.FETCH_TEMPLATES_FULFILLED:
            if(isArray(action.payload)) {
                return state.set('fetchingTemplates', API_REQUEST_STATE.FINISH).set('templates', List(action.payload));
            }
            return state.set('fetchingTemplates', API_REQUEST_STATE.FINISH).set('templates', List([]));
        case TemplatesAction.FETCH_TEMPLATES_REJECTED:
            return state.set('fetchingTemplates', API_REQUEST_STATE.ERROR).set('error', action.payload).set('templates', List([]));
        case TemplatesAction.DELETE_TEMPLATE:
            return state.set('deletingTemplate', API_REQUEST_STATE.START).set('error', null);
        case TemplatesAction.DELETE_TEMPLATE_FULFILLED:
            index = templates.findIndex(function (template) {
                return template.templateId === action.payload.templateId;
            });
            if(index >= 0) {
                return state.set('deletingTemplate', API_REQUEST_STATE.FINISH).set('templates', templates.delete(index));
            }
            return state.set('deletingTemplate', API_REQUEST_STATE.FINISH);
        case TemplatesAction.DELETE_TEMPLATE_REJECTED:
            return state.set('deletingTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case TemplatesAction.IMPORT_TEMPLATE:
            return state.set('importingTemplate', API_REQUEST_STATE.START).set('error', null);
        case TemplatesAction.IMPORT_TEMPLATE_FULFILLED:
            if(action.payload) {
                return state.set('importingTemplate', API_REQUEST_STATE.FINISH).set('templates', templates.set(templates.size, action.payload));
            }
            return state.set('importingTemplate', API_REQUEST_STATE.FINISH);
        case TemplatesAction.IMPORT_TEMPLATE_REJECTED:
            return state.set('importingTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case TemplatesAction.EXPORT_TEMPLATE:
            return state.set('exportingTemplate', API_REQUEST_STATE.START).set('error', null).set('exportedTemplate', action.payload);
        case TemplatesAction.EXPORT_TEMPLATE_FULFILLED:
            console.log(action.payload.templateContent);
            let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(action.payload.templateContent));
            let downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href",     dataStr);
            downloadAnchorNode.setAttribute("download", action.payload.templateId + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            return state.set('exportingTemplate', API_REQUEST_STATE.FINISH);
        case TemplatesAction.EXPORT_TEMPLATE_REJECTED:
            return state.set('exportingTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as templates};