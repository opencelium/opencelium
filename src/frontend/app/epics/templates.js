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
import {TemplatesAction} from '@utils/actions';
import {
    fetchTemplatesFulfilled, fetchTemplatesRejected,
    exportTemplateFulfilled, exportTemplateRejected,
} from '@actions/templates/fetch';
import {
    addTemplateFulfilled, addTemplateRejected,
    importTemplateFulfilled, importTemplateRejected,
} from '@actions/templates/add';
import {deleteTemplateFulfilled, deleteTemplateRejected} from '@actions/templates/delete';
import {doRequest} from "@utils/auth";
import {API_METHOD} from "@utils/constants/app";
import {
    convertTemplateFulfilled,
    convertTemplateRejected,
    convertTemplatesFulfilled,
    convertTemplatesRejected
} from "@actions/templates/update";
import {checkConnectionFulfilled} from "@actions/connections/check";


/*
 * currently templates are static on the frontend
 */

/**
 * main url for templates
 */
const urlPrefix = 'template';


/**
 * fetch all templates
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchTemplatesEpic = (action$, store) => {
    return action$.ofType(TemplatesAction.FETCH_TEMPLATES)
        .debounceTime(500)
        .mergeMap((action) => {
            let from = action.payload ? action.payload.from : null;
            let to = action.payload ? action.payload.to : null;
            let url = from && to ? `${urlPrefix}/all/${from}/${to}` : `${urlPrefix}/all`;
            return doRequest({url},{
                success: (data) => fetchTemplatesFulfilled(data, action.settings),
                reject: fetchTemplatesRejected,
            });
        });
};

/**
 * add one template
 */
const addTemplateEpic = (action$, store) => {
    return action$.ofType(TemplatesAction.ADD_TEMPLATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            let data = action.payload;
            return doRequest({url, method: API_METHOD.POST, data},{
                success: addTemplateFulfilled,
                reject: addTemplateRejected,},
            );
        });
};

/**
 * convert one template
 */
const convertTemplateEpic = (action$, store) => {
    return action$.ofType(TemplatesAction.CONVERT_TEMPLATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.templateId}`;
            let {...data} = action.payload;
            return doRequest({url, method: API_METHOD.PUT, data},{
                success: convertTemplateFulfilled,
                reject: convertTemplateRejected,},
                res => {return {newTemplate: res.response, oldTemplate: data};}
            );
        });
};

/**
 * convert templates
 */
const convertTemplatesEpic = (action$, store) => {
    return action$.ofType(TemplatesAction.CONVERT_TEMPLATES)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.templateId}`;
            let data = action.payload;
            /*
            * TODO: Rework when backend will be done
            */
            return Rx.Observable.of(convertTemplatesFulfilled({newTemplates: data, oldTemplates: data}));
            /*return doRequest({url, method: API_METHOD.PUT, data: {templates:data}},{
                    success: convertTemplatesFulfilled,
                    reject: convertTemplatesRejected,},
                res => {return {newTemplates: data, oldTemplates: data};}
            );*/
        });
};


/**
 * delete one template by id
 */
const deleteTemplateEpic = (action$, store) => {
    return action$.ofType(TemplatesAction.DELETE_TEMPLATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let id = action.payload.hasOwnProperty('templateId') ? action.payload.templateId : action.payload.id;
            let url = `${urlPrefix}/${id}`;
            return doRequest({url, method: API_METHOD.DELETE},{
                    success: deleteTemplateFulfilled,
                    reject: deleteTemplateRejected,},
                res => {return {...res.response, templateId: id};}
            );
        });
};

/**
 * import template
 */
const importTemplateEpic = (action$, store) => {
    return action$.ofType(TemplatesAction.IMPORT_TEMPLATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `storage/${urlPrefix}`;
            let data = new FormData();
            data.append('file', action.payload.template);
            return doRequest({url, method: API_METHOD.POST, data, contentType: 'multipart/form-data'},{
                success: importTemplateFulfilled,
                reject: importTemplateRejected,},
            );
        });
};

/**
 * export template
 */
const exportTemplateEpic = (action$, store) => {
    return action$.ofType(TemplatesAction.EXPORT_TEMPLATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = action.payload.link;
            return doRequest({url, fullUrl: true},{
                success: exportTemplateFulfilled,
                reject: exportTemplateRejected,},
                res => {return {...action.payload, templateContent: res.response};}
            );
        });
};



export {
    fetchTemplatesEpic,
    addTemplateEpic,
    convertTemplateEpic,
    convertTemplatesEpic,
    deleteTemplateEpic,
    importTemplateEpic,
    exportTemplateEpic,
};