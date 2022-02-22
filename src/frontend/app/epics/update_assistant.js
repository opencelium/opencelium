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
import {
    uploadVersionFulfilled, uploadVersionRejected,
    addConvertTemplatesLogsFulfilled, addConvertTemplatesLogsRejected,
    addConvertInvokersLogsFulfilled, addConvertInvokersLogsRejected,
    addConvertConnectionsLogsFulfilled, addConvertConnectionsLogsRejected,
} from "@actions/update_assistant/add";
import {
    updateTemplatesFulfilled, updateTemplatesRejected,
    updateInvokersFulfilled, updateInvokersRejected,
    updateConnectionsFulfilled, updateConnectionsRejected,
    updateSystemFulfilled, updateSystemRejected,
} from "@actions/update_assistant/update";
import {
    checkResetFilesRejected, checkResetFilesFulfilled,
} from "@actions/update_assistant/check";
import {VERSION_STATUS} from "@components/content/update_assistant/available_updates/AvailableUpdates";


const urlPrefix = 'assistant/oc';

/**
 * fetch update application version
 */
const fetchUpdateAppVersionEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.FETCH_UPDATEAPPVERSION)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}/online/versions`;
            const currentAppVersion = action.settings.currentAppVersion;
            return doRequest({url},{
                success: (data) => {
                    let versions = data.filter(v => v.status === VERSION_STATUS.AVAILABLE);
                    let version = currentAppVersion;
                    if(versions.length > 0){
                        version = versions[0].name;
                    }
                    let background = currentAppVersion === version ? true : action.settings?.background || false;
                    return fetchUpdateAppVersionFulfilled({version}, {...action.settings, background});},
                reject: fetchUpdateAppVersionRejected,
            });
        });
};

/**
 * fetch online updates
 */
const fetchOnlineUpdatesEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.FETCH_ONLINEUPDATES)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}/online/versions`;
            //return Rx.Observable.of(fetchOnlineUpdatesFulfilled(ONLINE_UPDATES));
            return doRequest({url},{
                success: (data) => fetchOnlineUpdatesFulfilled(data, {...action.settings}),
                reject: fetchOnlineUpdatesRejected,
                cancel: action$.ofType(UpdateAssistantAction.FETCH_ONLINEUPDATES_CANCELED),
            });
        });
};

/**
 * fetch offline updates
 */
const fetchOfflineUpdatesEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.FETCH_OFFLINEUPDATES)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}/offline/versions`;
            //return Rx.Observable.of(fetchOfflineUpdatesFulfilled(OFFLINE_UPDATES));
            return doRequest({url},{
                success: (data) => fetchOfflineUpdatesFulfilled(data, {...action.settings}),
                reject: fetchOfflineUpdatesRejected,
                cancel: action$.ofType(UpdateAssistantAction.FETCH_OFFLINEUPDATES_CANCELED),
            });
        });
};

/**
 * delete version by name
 */
const deleteVersionEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.DELETE_VERSION)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `storage/assistant/zipfile/${action.payload.folder}`;
            return doRequest({url, method: API_METHOD.DELETE},{
                    success: deleteVersionFulfilled,
                    reject: deleteVersionRejected,},
                res => {return action.payload;}
            );
        });
};

/**
 * upload version
 */
const uploadVersionEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.UPLOAD_VERSION)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `storage/assistant/zipfile`;
            let data = new FormData();
            data.append('file', action.payload.versionFile);
            //return Rx.Observable.of(uploadVersionFulfilled(NEW_UPDATE));
            return doRequest({url, method: API_METHOD.POST, data, contentType: 'multipart/form-data'},{
                success: uploadVersionFulfilled,
                reject: uploadVersionRejected,},
            );
        });
};

/**
 * update templates
 */
const updateTemplatesForAssistantEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT)
        .debounceTime(100)
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
        .debounceTime(100)
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
 * update connections
 */
const updateConnectionsForAssistantEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.UPDATE_CONNECTIONSFORASSISTANT)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            let data = action.payload;
            return Rx.Observable.of(updateConnectionsFulfilled({newConnections: data, oldConnections: data}));
            /*return doRequest({url, method: API_METHOD.PUT, data},{
                    success: updateConnectionsFulfilled,
                    reject: updateConnectionsRejected},
                res => {return {newTemplates: res.response._embedded.templateResourceList, oldTemplates: data};}
            );*/
        });
};

/**
 * update system
 */
const updateSystemForAssistantEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.UPDATE_SYSTEM)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `assistant/oc/migrate`;
            let data = action.payload;
            return doRequest({url, method: API_METHOD.POST, data},{
                    success: updateSystemFulfilled,
                    reject: updateSystemRejected,
            });
        });
};

/**
 * fetch system requirements
 */
const fetchSystemRequirementsEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.FETCH_SYSTEMREQUIREMENTS)
        .debounceTime(100)
        .mergeMap((action) => {
            //const url = `${urlPrefix}/system/overview`;
            const url = 'actuator/health';
            return doRequest({url, isApi: false, hasAuthHeader: true},{
                success: (data) => fetchSystemRequirementsFulfilled(data, {...action.settings}),
                reject: fetchSystemRequirementsRejected,
            });
        });
};

/**
 * add logs after convert templates
 */
const addConvertTemplatesLogsEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.ADD_CONVERTTEMPLATESLOGS)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return Rx.Observable.of(addConvertTemplatesLogsFulfilled(action.payload));
            /*return doRequest({url, method: API_METHOD.POST, data: action.payload},{
                success: addConvertTemplatesLogsFulfilled,
                reject: addConvertTemplatesLogsRejected,},
            );*/
        });
};

/**
 * add logs after convert invokers
 */
const addConvertInvokersLogsEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.ADD_CONVERTINVOKERSLOGS)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return Rx.Observable.of(addConvertInvokersLogsFulfilled(action.payload));
            /*return doRequest({url, method: API_METHOD.POST, data: action.payload},{
                success: addConvertInvokersLogsFulfilled,
                reject: addConvertInvokersLogsRejected,},
            );*/
        });
};

/**
 * add logs after convert connections
 */
const addConvertConnectionsLogsEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.ADD_CONVERTCONNECTIONSLOGS)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return Rx.Observable.of(addConvertConnectionsLogsFulfilled(action.payload));
            /*return doRequest({url, method: API_METHOD.POST, data: action.payload},{
                success: addConvertConnectionsLogsFulfilled,
                reject: addConvertConnectionsLogsRejected,},
            );*/
        });
};

/**
 * check reset files version
 */
const checkResetFilesEpic = (action$, store) => {
    return action$.ofType(UpdateAssistantAction.CHECK_RESETFILES)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}/restart/file/exists`;
            return doRequest({url},{
                success: (data) => checkResetFilesFulfilled(data, {...action.settings}),
                reject: checkResetFilesRejected,
            });
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
    updateConnectionsForAssistantEpic,
    updateSystemForAssistantEpic,
    fetchSystemRequirementsEpic,
    addConvertTemplatesLogsEpic,
    addConvertInvokersLogsEpic,
    addConvertConnectionsLogsEpic,
    checkResetFilesEpic,
};