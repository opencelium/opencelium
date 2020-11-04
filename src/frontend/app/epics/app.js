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

import {AppAction, ComponentsAction} from '@utils/actions';
import {
    addErrorTicketFulfilled, addErrorTicketRejected
} from '@actions/app';
import {doRequest} from "@utils/auth";
import {API_METHOD} from "@utils/constants/app";
import {fetchComponentsFulfilled, fetchComponentsRejected} from "@actions/components/fetch";
import {fetchAppsFulfilled, fetchAppsRejected} from "@actions/apps/fetch";


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
            let url = `application/oc/version`;
            return doRequest({url},{
                success: fetchAppsFulfilled,
                reject: fetchAppsRejected,
            });
        });
};


export {
    addErrorTicketEpic,
    fetchAppVersionEpic,
};