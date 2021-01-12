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
} from '@actions/update_assistant/fetch';
import {doRequest} from "@utils/auth";
import Rx from "rxjs";


const ONLINE_UPDATES = [
    {id: 1, name: 'v1.2', changeLogLink: ''},
    {id: 1, name: 'v1.2.1', changeLogLink: ''},
    {id: 1, name: 'v1.2.2', changeLogLink: ''},
    {id: 1, name: 'v1.3', changeLogLink: ''},
    {id: 1, name: 'v1.3.1', changeLogLink: ''},
    {id: 1, name: 'v1.3.2', changeLogLink: ''},
    {id: 1, name: 'v1.4', changeLogLink: ''},
];
const OFFLINE_UPDATES = [
    {id: 1, name: 'v1.2', changeLogLink: ''},
    {id: 1, name: 'v1.2.2', changeLogLink: ''},
    {id: 1, name: 'v1.3', changeLogLink: ''},
    {id: 1, name: 'v1.3.2', changeLogLink: ''},
    {id: 1, name: 'v1.4', changeLogLink: ''},
];

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
            let url = `update_assistant/online`;
            return () => Rx.Observable.of(fetchOnlineUpdatesFulfilled(ONLINE_UPDATES));
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
            let url = `update_assistant/offline`;
            return () => Rx.Observable.of(fetchOfflineUpdatesFulfilled(OFFLINE_UPDATES));
            /*return doRequest({url},{
                success: (data) => fetchOfflineUpdatesFulfilled(data, {...action.settings}),
                reject: fetchOfflineUpdatesRejected,
            });*/
        });
};


export {
    fetchUpdateAppVersionEpic,
    fetchOnlineUpdatesEpic,
    fetchOfflineUpdatesEpic
};