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

import {ConnectionsAction} from '../utils/actions';
import {
    fetchConnectionFulfilled, fetchConnectionRejected,
    fetchConnectionsFulfilled, fetchConnectionsRejected,
    checkConnectionTitleFulfilled, checkConnectionTitleRejected,
    validateConnectionFormMethodsFulfilled, validateConnectionFormMethodsRejected,
} from '../actions/connections/fetch';
import {
    addConnectionFulfilled ,addConnectionRejected,
} from '../actions/connections/add';
import {updateConnectionFulfilled, updateConnectionRejected,
} from '../actions/connections/update';
import {deleteConnectionFulfilled, deleteConnectionRejected} from '../actions/connections/delete';
import {doRequest} from "../utils/auth";


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
            let url = `${urlPrefix}/check/${action.payload.title}`;
            return doRequest({url},{
                success: validateConnectionFormMethodsFulfilled,
                reject: validateConnectionFormMethodsRejected,
            });
        });
};

/**
 * check connection's title on existing
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
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
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchConnectionEpic = (action$, store) => {
    return action$.ofType(ConnectionsAction.FETCH_CONNECTION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
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
            let url = `${urlPrefix}/all`;
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
            return doRequest({url, method: 'post', data},{
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
            return doRequest({url, method: 'put', data},{
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
            return doRequest({url, method: 'delete'},{
                    success: deleteConnectionFulfilled,
                    reject: deleteConnectionRejected,},
                res => {return {connectionId: action.payload.id};}
            );
        });
};


export {
    fetchConnectionEpic,
    fetchConnectionsEpic,
    addConnectionEpic,
    updateConnectionEpic,
    deleteConnectionEpic,
    checkConnectionTitleEpic,
    validateConnectionFormMethodsEpic,
};