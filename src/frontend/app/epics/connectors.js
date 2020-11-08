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

import {ConnectorsAction} from '@utils/actions';
import {
    fetchConnectorFulfilled, fetchConnectorRejected,
    fetchConnectorsFulfilled, fetchConnectorsRejected,
} from '@actions/connectors/fetch';
import {
    addConnectorFulfilled ,addConnectorRejected,
    addConnectorIcon, addConnectorIconFulfilled, addConnectorIconRejected,
} from '@actions/connectors/add';
import {testConnectorFulfilled, testConnectorRejected} from '@actions/connectors/test';
import {
    updateConnectorFulfilled, updateConnectorRejected,
    updateConnectorIcon, updateConnectorIconFulfilled, updateConnectorIconRejected,
} from '@actions/connectors/update';
import {deleteConnectorFulfilled, deleteConnectorRejected} from '@actions/connectors/delete';
import {doRequest} from "@utils/auth";
import {addProfilePicture, addUserFulfilled, addUserRejected} from "@actions/users/add";
import {API_METHOD} from "@utils/constants/app";
import {isString} from "@utils/app";


/**
 * main url for connectors
 */
const urlPrefix = 'connector';

/**
 * test connector on valid credential data
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const testConnectorEpic = (action$, store) => {
    return action$.ofType(ConnectorsAction.TEST_CONNECTOR)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/check`;
            let data = action.payload;
            if(data.hasOwnProperty('icon')) {
                delete data.icon;
            }
            return doRequest({url, method: API_METHOD.POST, data},{
                    success: testConnectorFulfilled,
                    reject: testConnectorRejected,},
            );
        });
};

/**
 * fetch one connector by id
 */
const fetchConnectorEpic = (action$, store) => {
    return action$.ofType(ConnectorsAction.FETCH_CONNECTOR)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url},{
                success: fetchConnectorFulfilled,
                reject: fetchConnectorRejected,
            });
        });
};

/**
 * fetch all connectors
 */
const fetchConnectorsEpic = (action$, store) => {
    return action$.ofType(ConnectorsAction.FETCH_CONNECTORS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            return doRequest({url},{
                success: (data) => fetchConnectorsFulfilled(data, action.settings),
                reject: fetchConnectorsRejected,
                cancel: action$.ofType(ConnectorsAction.FETCH_CONNECTORS_CANCELED)
            });
        });
};

/**
 * add one connector
 */
const addConnectorEpic = (action$, store) => {
    return action$.ofType(ConnectorsAction.ADD_CONNECTOR)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            let connectorIcon = action.payload.icon;
            let data = {...action.payload};
            let successResponse = addConnectorFulfilled;
            if(data.icon !== null && data.icon !== ''){
                successResponse = addConnectorIcon;
            }
            delete data.icon;
            return doRequest({url, method: API_METHOD.POST, data: {...data}},{
                    success: successResponse,
                    reject: addConnectorRejected,},
                res => {
                    let result = res.response;
                    result.icon = connectorIcon;
                    return result;
                });
        });
};
/**
 * add connector icon to the corresponded connector
 */
const addConnectorIconEpic = (action$, store) => {
    return action$.ofType(ConnectorsAction.ADD_CONNECTORICON)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `storage/connector`;
            let data = new FormData();
            data.append('connectorId', action.payload.connectorId);
            data.append('file', action.payload.icon);
            return doRequest({url, method: API_METHOD.POST, data, contentType: 'multipart/form-data'},{
                    success: addConnectorIconFulfilled,
                    reject: addConnectorIconRejected,},
                res => {return action.payload;}
            );
        });
};


/**
 * update one connector
 */
const updateConnectorEpic = (action$, store) => {
    return action$.ofType(ConnectorsAction.UPDATE_CONNECTOR)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            let connectorIcon = action.payload.icon;
            let data = {...action.payload};
            let successResponse = updateConnectorFulfilled;
            if(data.icon && !isString(data.icon)){
                successResponse = updateConnectorIcon;
            }
            delete data.icon;
            return doRequest({url, method: API_METHOD.PUT, data: {...data}},{
                    success: successResponse,
                    reject: updateConnectorRejected,},
                res => {
                    let result = res.response;
                    result.icon = connectorIcon;
                    return result;
                });
        });
};

/**
 * update one connector icon
 */
const updateConnectorIconEpic = (action$, store) => {
    return action$.ofType(ConnectorsAction.UPDATE_CONNECTORICON)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `storage/connector`;
            let data = new FormData();
            data.append('connectorId', action.payload.connectorId);
            data.append('file', action.payload.icon);
            return doRequest({url, method: API_METHOD.POST, data, contentType: 'multipart/form-data'},{
                    success: updateConnectorIconFulfilled,
                    reject: updateConnectorIconRejected,},
                res => {return action.payload;}
            );
        });
};

/**
 * delete one connector by id
 */
const deleteConnectorEpic = (action$, store) => {
    return action$.ofType(ConnectorsAction.DELETE_CONNECTOR)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url, method: API_METHOD.DELETE},{
                    success: deleteConnectorFulfilled,
                    reject: deleteConnectorRejected,},
                res => {return {...res.response, id: action.payload.id};}
            );
        });
};


export {
    fetchConnectorEpic,
    fetchConnectorsEpic,
    addConnectorEpic,
    addConnectorIconEpic,
    updateConnectorEpic,
    updateConnectorIconEpic,
    deleteConnectorEpic,
    testConnectorEpic,
};