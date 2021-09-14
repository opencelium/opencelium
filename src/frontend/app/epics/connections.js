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
import {ConnectionsAction} from '@utils/actions';
import {
    fetchConnection, fetchConnectionFulfilled, fetchConnectionRejected,
    fetchConnections, fetchConnectionsFulfilled, fetchConnectionsRejected,
    checkConnectionTitleFulfilled, checkConnectionTitleRejected,
    validateConnectionFormMethodsFulfilled, validateConnectionFormMethodsRejected,
    checkNeo4j, checkNeo4jFulfilled, checkNeo4jRejected, sendOperationRequestFulfilled, sendOperationRequestRejected,
} from '@actions/connections/fetch';
import {
    addConnectionFulfilled ,addConnectionRejected,
} from '@actions/connections/add';
import {updateConnectionFulfilled, updateConnectionRejected,
} from '@actions/connections/update';
import {
    deleteConnectionFulfilled,
    deleteConnectionRejected,
    deleteConnectionsFulfilled, deleteConnectionsRejected
} from '@actions/connections/delete';
import {doRequest} from "@utils/auth";
import {APP_STATUS_DOWN, APP_STATUS_UP} from "@utils/constants/url";
import {checkConnectionFulfilled, checkConnectionRejected} from "@actions/connections/check";
import {API_METHOD} from "@utils/constants/app";


/**
 * main url for connections
 */
const urlPrefix = 'connection';

/**
 * validate connection's form methods
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const validateConnectionFormMethodsEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.VALIDATE_FORMMETHODS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/validate`;
            return doRequest({url, method: API_METHOD.POST, data: action.payload},{
                success: validateConnectionFormMethodsFulfilled,
                reject: validateConnectionFormMethodsRejected,
            });
        });
};

/**
 * check neo4j status
 */
const checkNeo4jEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.CHECK_NEO4J)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = 'actuator/health/neo4j';
            let {callbackData} = action;
            return doRequest({url, isApi: false, hasAuthHeader: true},{
                success: ((data) => {
                    if(data && data.status === APP_STATUS_DOWN){
                        return checkNeo4jRejected({'message': "DOWN", systemTitle: 'NEO4J', neo4j: data, callbackData});
                    }
                    return checkNeo4jFulfilled({neo4j: data, callbackData});
                }),
                reject: (ajax) => Rx.Observable.of(checkNeo4jRejected(ajax))},
            );
        });
};

/**
 * check neo4j status fulfilled
 */
const checkNeo4jFulfilledEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.CHECK_NEO4J_FULFILLED, ConnectionsAction.CHECK_NEO4J_REJECTED)
        .debounceTime(500)
        .mergeMap((action) => {
            let {callbackData, neo4j} = action.payload;
            if(callbackData && callbackData.hasOwnProperty('callback')){
                let params = callbackData.hasOwnProperty('params') ? callbackData.params : null;
                let settings = callbackData.hasOwnProperty('settings') ? callbackData.settings : {};
                if(params) {
                    return Rx.Observable.of(callbackData.callback(params, {...settings, neo4j}));
                } else{
                    return Rx.Observable.of(callbackData.callback({...settings, neo4j}));
                }
            }
            return checkNeo4jRejected(action.payload);
        });
};

/**
 * check connection's title on existing
 */
const checkConnectionTitleEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.CHECK_CONNECTIONTITLE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/check/${action.payload.title}`;
            return doRequest({url},{
                success: checkConnectionTitleFulfilled,
                reject: checkConnectionTitleRejected,
            });
        });
};

/**
 * fetch one connection by id
 */
const fetchConnectionEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.FETCH_CONNECTION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            let neo4j = action.settings ? action.settings.neo4j : null;
            if(!neo4j){
                return checkNeo4j({callback: fetchConnection, params: action.payload, settings: action.settings});
            } else{
                if(neo4j.status === APP_STATUS_DOWN){
                    return fetchConnectionRejected(action.settings);
                }
            }
            return doRequest({url},{
                success: fetchConnectionFulfilled,
                reject: fetchConnectionRejected,
            });
        });
};

/**
 * fetch all connections
 */
const fetchConnectionsEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.FETCH_CONNECTIONS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all/meta`;
            let neo4j = action.settings ? action.settings.neo4j : null;
            if(!neo4j){
                return checkNeo4j({callback: fetchConnections, settings: action.settings});
            } else{
                if(neo4j.status === APP_STATUS_DOWN){
                    return fetchConnectionsRejected(action.settings);
                }
            }
            return doRequest({url},{
                success: (data) => fetchConnectionsFulfilled(data, action.settings),
                reject: fetchConnectionsRejected,
                cancel: action$.ofType(ConnectionsAction.FETCH_CONNECTIONS_CANCELED)
            });
        });
};

/**
 * add one connection
 */
const addConnectionEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.ADD_CONNECTION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            let data = action.payload;
            return doRequest({url, method: API_METHOD.POST, data},{
                    success: addConnectionFulfilled,
                    reject: addConnectionRejected,},
            );
        });
};

/**
 * update one connection
 */
const updateConnectionEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.UPDATE_CONNECTION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            let {id, ...data} = action.payload;
            return doRequest({url, method: API_METHOD.PUT, data},{
                    success: updateConnectionFulfilled,
                    reject: updateConnectionRejected,},
            );
        });
};

/**
 * delete one connection by id
 */
const deleteConnectionEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.DELETE_CONNECTION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url, method: API_METHOD.DELETE},{
                    success: deleteConnectionFulfilled,
                    reject: deleteConnectionRejected,},
                res => {return {connectionId: action.payload.id};}
            );
        });
};

/**
 * delete connections by ids
 */
const deleteConnectionsEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.DELETE_CONNECTIONS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            const data = action.payload;
            return doRequest({url, method: API_METHOD.DELETE, data},{
                    success: deleteConnectionsFulfilled,
                    reject: deleteConnectionsRejected,},
                res => {return {ids: action.payload};}
            );
        });
};

/**
 * send operation request
 */
const sendOperationRequestEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.SEND_OPERATIONREQUEST)
        .debounceTime(500)
        .mergeMap((action) => {
            const data = action.payload;
            const url = `${urlPrefix}/remoteapi/test`;
            return doRequest({url, method: API_METHOD.POST, data: {url: data.endpoint, header: data.header, method: data.method, body: data.body}},{
                success: sendOperationRequestFulfilled,
                reject: sendOperationRequestRejected,},
            );
        });
};

/**
 * check one connection
 */
const checkConnectionEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.CHECK_CONNECTION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/check`;
            let data = action.payload;
            return Rx.Observable.of(checkConnectionFulfilled({}));
            return doRequest({url, method: API_METHOD.POST, data},{
                success: checkConnectionFulfilled,
                reject: checkConnectionRejected,},
            );
        });
};


export {
    fetchConnectionEpic,
    fetchConnectionsEpic,
    addConnectionEpic,
    updateConnectionEpic,
    deleteConnectionEpic,
    deleteConnectionsEpic,
    checkConnectionTitleEpic,
    validateConnectionFormMethodsEpic,
    checkNeo4jEpic,
    checkNeo4jFulfilledEpic,
    sendOperationRequestEpic,
    checkConnectionEpic,
};