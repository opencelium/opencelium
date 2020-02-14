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

import {AppsAction} from '../utils/actions';
import {
    fetchAppsFulfilled, fetchAppsRejected,
    loadAppsLinkFulfilled, loadAppsLinkRejected,
    checkAppFulfilled, checkAppRejected,
} from '../actions/apps/fetch';
import {doRequest} from "../utils/auth";
import {APP_STATUS_DOWN, APP_STATUS_UP, kibanaUrl, neo4jUrl} from "../utils/constants/url";


const apps = [
    {id: 1, name: 'Kibana', icon: '../../img/apps/kibana.png', link: kibanaUrl, value: 'elasticsearch'},
    {id: 2, name: 'Neo4j', icon: '../../img/apps/neo4j.png', link: neo4jUrl, value: 'neo4j'},
];

/**
 * main url for applications
 */
const urlPrefix = 'actuator/health';

/**
 * fetch all applications
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchAppsEpic = (action$, store) => {
    return action$.ofType(AppsAction.FETCH_APPS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return doRequest({url, isApi: false, hasAuthHeader: true},{
                success: (data) => fetchAppsFulfilled(apps.map(app => {
                    let status = APP_STATUS_DOWN;
                    if(data && data.hasOwnProperty('details') && data.details[app.value] && data.details[app.value].status
                        && (data.details[app.value].status === APP_STATUS_UP || data.details[app.value].status === APP_STATUS_DOWN)){
                        status = data.details[app.value].status;
                    }
                    return {...app, status};
                }), action.settings),
                reject: fetchAppsRejected,
            });
        });
};

const loadAppsLinkEpic = (action$, store) => {
    return action$.ofType(AppsAction.LOAD_APPSLINK)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = action.payload.link;
            return doRequest({fullUrl: true, url},{
                success: loadAppsLinkFulfilled,
                reject: loadAppsLinkRejected,},
                res => {return {url};}
            );
        });
};

const checkAppEpic = (action$, store) => {
    return action$.ofType(AppsAction.CHECK_APP)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.name}`;
            return doRequest({url, isApi: false, hasAuthHeader: true},{
                success: checkAppFulfilled,
                reject: checkAppRejected,
            });
        });
};



export {
    fetchAppsEpic,
    loadAppsLinkEpic,
    checkAppEpic,
};