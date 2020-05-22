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

import Rx from 'rxjs/Rx';
import {AppsAction} from '../utils/actions';
import {
    fetchAppsFulfilled, fetchAppsRejected,
    checkAppFulfilled, checkAppRejected,
} from '../actions/apps/fetch';
import {doRequest} from "../utils/auth";
import {APP_STATUS_DOWN, APP_STATUS_UP, kibanaUrl, neo4jUrl} from "../utils/constants/url";
import i18n from '../utils/i18n';
import {NotificationType} from "../utils/constants/notifications/notifications";

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

const checkAppEpic = (action$, store) => {
    return action$.ofType(AppsAction.CHECK_APP)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.value}`;
            return doRequest({url, isApi: false, hasAuthHeader: true},{
                success: ((data) => {
                    if(data && data.status === APP_STATUS_DOWN){
                        let message = data.details.error;
                        let shortMessage = '';
                        if(message.length > 50){
                            shortMessage = `${i18n.t(`notifications:SYSTEMS.${action.payload.value.toUpperCase()}`)} ${i18n.t('notifications:ERROR.CHECK_APP.DOWN')}`;
                        }
                        return checkAppRejected({notificationType: NotificationType.NOTE, message, systemTitle: action.payload.value, shortMessage});
                    }
                    return checkAppFulfilled({...data, link: action.payload.link});
                }),
                reject: (ajax) => Rx.Observable.of(checkAppRejected(ajax))},
            );
        });
};



export {
    fetchAppsEpic,
    checkAppEpic,
};