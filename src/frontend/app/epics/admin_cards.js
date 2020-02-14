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

import {AdminCardsAction} from '../utils/actions';
import {
    fetchAdminCardsFulfilled, fetchAdminCardsRejected,
    loadAdminCardsLinkFulfilled, loadAdminCardsLinkRejected,
} from '../actions/admin_cards/fetch';
import {doRequest} from "../utils/auth";
import {invokerUrl, appUrl} from "../utils/constants/url";


const adminCards = [
    //{id: 1, name: 'App', link: '/apps'},
    {id: 2, name: 'Invokers', link: '/invokers'},
    {id: 3, name: 'Templates', link: '/templates'},
];

/**
 * main url for applications
 */
const urlPrefix = 'admin_cards';

/**
 * fetch all applications
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchAdminCardsEpic = (action$, store) => {
    return action$.ofType(AdminCardsAction.FETCH_ADMINCARDS)
        .debounceTime(500)
        .mergeMap((action) => {
            /*let url = `${urlPrefix}/all`;1
            return doRequest({url},{
                success: (data) => fetchAdminCardsFulfilled(data, action.settings),
                reject: fetchAppsRejected,
            });*/
            return fetchAdminCardsFulfilled(adminCards, action.settings);
        });
};

const loadAdminCardsLinkEpic = (action$, store) => {
    return action$.ofType(AdminCardsAction.LOAD_ADMINCARD)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = action.payload.link;
            return doRequest({fullUrl: true, url}, {
                success: loadAdminCardsLinkFulfilled,
                reject: loadAdminCardsLinkRejected,
            });
        });
};



export {
    fetchAdminCardsEpic,
    loadAdminCardsLinkEpic,
};