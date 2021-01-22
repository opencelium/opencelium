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

import {UpdateAssistantAction} from '@utils/actions';
import {
    fetchUpdateAppVersionFulfilled, fetchUpdateAppVersionRejected,
    fetchOnlineUpdatesFulfilled, fetchOnlineUpdatesRejected,
    fetchOfflineUpdatesFulfilled, fetchOfflineUpdatesRejected,
    fetchSystemRequirementsFulfilled, fetchSystemRequirementsRejected,
} from '@actions/update_assistant/fetch';
import {doRequest} from "@utils/auth";
import Rx from "rxjs";
import {API_METHOD} from "@utils/constants/app";
import {deleteVersionFulfilled, deleteVersionRejected} from "@actions/update_assistant/delete";
import {uploadVersionFulfilled, uploadVersionRejected} from "@actions/update_assistant/add";
import {
    updateTemplatesFulfilled, updateTemplatesRejected,
    updateInvokersFulfilled, updateInvokersRejected,
} from "@actions/update_assistant/update";


const SYSTEM_REQUIREMENTS = {
    oc: 'Ubuntu 16.04 LTS',
    java: '16.04.2',
    nodeJS: '12.1',
    neo4j: '12.4',
    kibana: '10.43',
    elasticSearch: '10.42',
    mariaDB: '11.21',
};

const ONLINE_UPDATES = [
    {id: 4, name: '1.3', changeLogLink: '', status: 'current'},
    {id: 5, name: '1.3.1', changeLogLink: '', status: 'available'},
    {id: 6, name: '1.3.2', changeLogLink: '', status: 'available'},
    {id: 7, name: '1.4', changeLogLink: '', status: 'not_available'},
];
const OFFLINE_UPDATES = [
    {id: 0, name: '1.1', changeLogLink: '', status: 'old'},
    {id: 1, name: '1.2', changeLogLink: '', status: 'old'},
    {id: 2, name: '1.2.2', changeLogLink: '', status: 'old'},
    {id: 3, name: '1.3', changeLogLink: '', status: 'current'},
    {id: 4, name: '1.3.2', changeLogLink: '', status: 'available'},
    {id: 5, name: '1.4', changeLogLink: '', status: 'not_available'},
    {id: 6, name: '1.4.1', changeLogLink: '', status: 'not_available'},
    {id: 7, name: '1.4.2', changeLogLink: '', status: 'not_available'},
];

const urlPrefix = 'update_assistant';

/**
 * fetch update application version
 */
const fetchUpdateAppVersionEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.FETCH_UPDATEAPPVERSION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `application/oc/version`;
            return doRequest({url},{
                success: (data) => fetchUpdateAppVersionFulfilled(data, {...action.settings}),
                reject: fetchUpdateAppVersionRejected,
            });
        });
};

/**
 * fetch online updates
 */
const fetchOnlineUpdatesEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.FETCH_ONLINEUPDATES)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/online`;
            return Rx.Observable.of(fetchOnlineUpdatesFulfilled(ONLINE_UPDATES));
            /*return doRequest({url},{
                success: (data) => fetchOnlineUpdatesFulfilled(data, {...action.settings}),
                reject: fetchOnlineUpdatesRejected,
            });*/
        });
};

/**
 * fetch offline updates
 */
const fetchOfflineUpdatesEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.FETCH_OFFLINEUPDATES)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/offline`;
            return Rx.Observable.of(fetchOfflineUpdatesFulfilled(OFFLINE_UPDATES));
            /*return doRequest({url},{
                success: (data) => fetchOfflineUpdatesFulfilled(data, {...action.settings}),
                reject: fetchOfflineUpdatesRejected,
            });*/
        });
};

/**
 * delete version by id
 */
const deleteVersionEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.DELETE_VERSION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return Rx.Observable.of(deleteVersionFulfilled(action.payload));
            /*return doRequest({url, method: API_METHOD.DELETE},{
                    success: deleteVersionFulfilled,
                    reject: deleteVersionRejected,},
                res => {return {connectionId: action.payload.id};}
            );*/
        });
};

/**
 * upload version
 */
const uploadVersionEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.UPLOAD_VERSION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return Rx.Observable.of(uploadVersionFulfilled(action.payload));
            /*return doRequest({url, method: API_METHOD.POST, data: action.payload},{
                success: uploadVersionFulfilled,
                reject: uploadVersionRejected,},
            );*/
        });
};

/**
 * update templates
 */
const updateTemplatesForAssistantEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            let data = action.payload;
            return Rx.Observable.of(updateTemplatesFulfilled({newTemplates: data, oldTemplates: data}));
            /*return doRequest({url, method: API_METHOD.PUT, data},{
                    success: convertTemplatesFulfilled,
                    reject: convertTemplatesRejected},
                res => {return {newTemplates: res.response._embedded.templateResourceList, oldTemplates: data};}
            );*/
        });
};

/**
 * update invokers
 */
const updateInvokersForAssistantEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            let data = action.payload;
            return Rx.Observable.of(updateInvokersFulfilled({newInvokers: data, oldInvokers: data}));
            /*return doRequest({url, method: API_METHOD.PUT, data},{
                    success: updateInvokersFulfilled,
                    reject: updateInvokersRejected},
                res => {return {newTemplates: res.response._embedded.templateResourceList, oldTemplates: data};}
            );*/
        });
};

/**
 * fetch system requirements
 */
const fetchSystemRequirementsEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.FETCH_SYSTEMREQUIREMENTS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/system_requirements`;
            return Rx.Observable.of(fetchSystemRequirementsFulfilled(SYSTEM_REQUIREMENTS));
            /*return doRequest({url},{
                success: (data) => fetchSystemRequirementsFulfilled(data, {...action.settings}),
                reject: fetchSystemRequirementsRejected,
            });*/
        });
};

export {
    fetchUpdateAppVersionEpic,
    fetchOnlineUpdatesEpic,
    fetchOfflineUpdatesEpic,
    deleteVersionEpic,
    uploadVersionEpic,
    updateTemplatesForAssistantEpic,
    updateInvokersForAssistantEpic,
    fetchSystemRequirementsEpic,
};