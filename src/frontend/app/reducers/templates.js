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
import {List, fromJS} from 'immutable';

import {TemplatesAction} from '@utils/actions';
import {isArray} from "@utils/app";
import {API_REQUEST_STATE} from "@utils/constants/app";


const initialState = fromJS({
    addingTemplate: API_REQUEST_STATE.INITIAL,
    duplicatingTemplate: API_REQUEST_STATE.INITIAL,
    updatingTemplate: API_REQUEST_STATE.INITIAL,
    fetchingTemplates: API_REQUEST_STATE.INITIAL,
    deletingTemplate: API_REQUEST_STATE.INITIAL,
    deletingTemplates: API_REQUEST_STATE.INITIAL,
    exportingTemplate: API_REQUEST_STATE.INITIAL,
    importingTemplate: API_REQUEST_STATE.INITIAL,
    convertingTemplatesState: API_REQUEST_STATE.INITIAL,
    template: {},
    exportedTemplate: {},
    templates: List([]),
    convertingTemplates: List([]),
    error: null,
    message: {},
    notificationData: {},
});

let templates = [];
let convertingTemplates = [];
let index = 0;
let indexes = [];

/**
 * redux reducer for templates
 */
const reducer = (state = initialState, action) => {
    templates = state.get('templates');
    convertingTemplates = state.get('convertingTemplates');
    indexes = [];
    switch (action.type) {
        case TemplatesAction.ADD_TEMPLATE:
            return state.set('addingTemplate', API_REQUEST_STATE.START).set('error', null);
        case TemplatesAction.ADD_TEMPLATE_FULFILLED:
            return state.set('addingTemplate', API_REQUEST_STATE.FINISH).set('templates', templates.set(templates.size, action.payload));
        case TemplatesAction.ADD_TEMPLATE_REJECTED:
            return state.set('addingTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case TemplatesAction.DUPLICATE_TEMPLATE:
            return state.set('duplicatingTemplate', API_REQUEST_STATE.START).set('error', null);
        case TemplatesAction.DUPLICATE_TEMPLATE_FULFILLED:
            return state.set('duplicatingTemplate', API_REQUEST_STATE.FINISH).set('templates', templates.set(templates.size, action.payload));
        case TemplatesAction.DUPLICATE_TEMPLATE_REJECTED:
            return state.set('duplicatingTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case TemplatesAction.CONVERT_TEMPLATE:
            return state.set('isRejected', false).set('isCanceled', false).set('error', null).set('convertingTemplates', convertingTemplates.set(convertingTemplates.size, action.payload));
        case TemplatesAction.CONVERT_TEMPLATE_FULFILLED:
            index = templates.findIndex(function (template) {
                return template.templateId === action.payload.oldTemplate.templateId;
            });
            if(index >= 0) {
                templates = templates.set(index, action.payload.newTemplate);
            }
            index = convertingTemplates.findIndex(function (template) {
                return template.templateId === action.payload.oldTemplate.templateId;
            });
            if(index >= 0) {
                convertingTemplates = convertingTemplates.delete(index);
            }
            return state.set('templates', templates).set('convertingTemplates', convertingTemplates);
        case TemplatesAction.CONVERT_TEMPLATE_REJECTED:
            return state.set('isRejected', true).set('error', action.payload).set('convertingTemplates', List([]));
        case TemplatesAction.CONVERT_TEMPLATES:
            return state.set('convertingTemplatesState', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null).set('convertingTemplates', List(action.payload));
        case TemplatesAction.CONVERT_TEMPLATES_FULFILLED:
            for(let i = 0; i < action.payload.oldTemplates.length; i++){
                index = templates.findIndex(function (template) {
                    return template.templateId === action.payload.oldTemplates[i].templateId;
                });
                if(index >= 0) {
                    templates = templates.set(index, action.payload.newTemplates[i]);
                }
                index = convertingTemplates.findIndex(function (template) {
                    return template.templateId === action.payload.oldTemplates[i].templateId;
                });
                if(index >= 0) {
                    convertingTemplates = convertingTemplates.delete(index);
                }
            }
            return state.set('convertingTemplatesState', API_REQUEST_STATE.FINISH).set('templates', templates).set('convertingTemplates', convertingTemplates);
        case TemplatesAction.CONVERT_TEMPLATES_REJECTED:
            return state.set('convertingTemplatesState', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload).set('convertingTemplates', List([]));
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
            return state.set('deletingTemplate', API_REQUEST_STATE.START).set('error', null).set('template', action.payload);
        case TemplatesAction.DELETE_TEMPLATE_FULFILLED:
            index = templates.findIndex(function (template) {
                return template.templateId === action.payload.templateId;
            });
            if(index >= 0) {
                return state.set('deletingTemplate', API_REQUEST_STATE.FINISH).set('templates', templates.delete(index)).set('template', null);
            }
            return state.set('deletingTemplate', API_REQUEST_STATE.FINISH).set('template', null);
        case TemplatesAction.DELETE_TEMPLATE_REJECTED:
            return state.set('deletingTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload).set('template', null);
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
        case TemplatesAction.DELETE_TEMPLATES:
            return state.set('deletingTemplates', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case TemplatesAction.DELETE_TEMPLATES_FULFILLED:
            for(let i = 0; i < action.payload.ids.length; i++) {
                indexes.push(templates.findIndex(function (template) {
                    return template.templateId === action.payload.ids[i];
                }));
            }
            if(indexes.length >= 0) {
                templates = templates.filter((u, key) => indexes.indexOf(key) === -1);
                return state.set('deletingTemplates', API_REQUEST_STATE.FINISH).set('templates', templates);
            }
            return state.set('deletingTemplates', API_REQUEST_STATE.FINISH);
        case TemplatesAction.DELETE_TEMPLATES_REJECTED:
            return state.set('deletingTemplates', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as templates};