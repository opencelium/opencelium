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

import {AppAction} from '@utils/actions';
import {
    addErrorTicketFulfilled, addErrorTicketRejected, fetchAppVersionFulfilled, fetchAppVersionRejected,
    fetchDataForSearchFulfilled, fetchDataForSearchRejected,
} from '@actions/app';
import {doRequest} from "@utils/auth";
import {API_METHOD} from "@utils/constants/app";
import Rx from "rxjs";
import {addConvertInvokersLogsFulfilled} from "@actions/update_assistant/add";


/**
 * main url for applications
 */
const urlPrefix = 'https://becon88.atlassian.net/rest/collectors/1.0/template/form/cb37ee4e';

/**
 * add error ticket
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const addErrorTicketEpic = (action$, store) => {
    return action$.ofType(AppAction.ADD_ERRORTICKET)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            let data = action.payload;
            return doRequest({url, method: API_METHOD.POST, data},{
                success: addErrorTicketFulfilled,
                reject: addErrorTicketRejected,},
            );
        });
};

/**
 * fetch application version
 */
const fetchAppVersionEpic = (action$, store) => {
    return action$.ofType(AppAction.FETCH_APPVERSION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `assistant/oc/version`;
            return doRequest({url},{
                success: (data) => fetchAppVersionFulfilled(data, {...action.settings}),
                reject: fetchAppVersionRejected,
            });
        });
};

/**
 * fetch data for search
 */
const fetchDataForSearchEpic = (action$, store) => {
    return action$.ofType(AppAction.FETCH_DATAFORSEARCH)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = ``;
            const data = {connections: [{id: 23, title: 'test'},{id: 24, title: 'test2'},], connectors: [{id: 10, title: 'i-doit'},{id: 11, title: 'xml'},{id: 12, title: 'w'},], schedules: [{id: 8, title: 'qwe'},]};
            return Rx.Observable.of(fetchDataForSearchFulfilled(data));
            /*return doRequest({url},{
                success: (data) => fetchDataForSearchFulfilled(data, {...action.settings}),
                reject: fetchDataForSearchRejected(),
            });*/
        });
};


export {
    addErrorTicketEpic,
    fetchAppVersionEpic,
    fetchDataForSearchEpic,
};