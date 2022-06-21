
/*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/*
* TODO: remove rx, rxjs after refactoring connections
*/
import Rx from 'rxjs/Rx';
import jwt from 'jsonwebtoken';

import {loginUserFulfilled, logoutUserFulfilled, sessionExpired} from '@actions/auth';
import {doRequestRejected} from '@actions/app';
import {updateMenu} from '@actions/app';

import {getCryptLS, setCryptLS} from '@entity/connection/components/utils/LocalStorage';
import {baseUrl, baseUrlApi} from '@entity/connection/components/utils/constants/url';
import {API_METHOD} from "@entity/connection/components/utils/constants/app";

const {ajax} = Rx.Observable;

export let sessionTimeout = null;

/**
 * set settings for each request
 */
export function getRequestSettings(params){
    let settings = {};
    let {url, method, data, isApi, contentType, fullUrl, isIframeUrl, hasAuthHeader, headers} = params;
    hasAuthHeader = hasAuthHeader ?? false;
    isApi = isApi ?? true;
    isIframeUrl = isIframeUrl ?? false;
    if(fullUrl !== true){
        url = isApi ? baseUrlApi + url : baseUrl + url;
    }
    method = method ?? API_METHOD.GET;
    data = data ?? {};
    settings.url = url;
    settings.method = method;
    settings.crossDomain = true;
    settings.timeout = 10000;
    settings.headers = headers ? {...headers} : {};
    if(typeof contentType === 'string'){
        if(contentType !== 'multipart/form-data'){
            settings.headers = {'Content-Type': contentType};
        }/* else{
            settings.headers = {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'};
        }*/
    } else{
        if(!isIframeUrl) {
            settings.headers = {'Content-Type': 'application/json'};
        }
        data = JSON.stringify(data);
    }
    if(isApi || hasAuthHeader){
        settings.headers['Authorization'] = getCryptLS('token');
    }
    switch(method){
        case API_METHOD.POST:
            settings.body = data;
            break;
        case API_METHOD.GET:
            settings.body = data;
            break;
        case API_METHOD.PUT:
            settings.body = data;
            break;
        case API_METHOD.DELETE:
            settings.body = data;
            break;
    }
    return settings;
}

/**
 * perform request
 *
 * @param requestParams: url, method, data, isApi, contentType, fullUrl, isIframeUrl
 * @param callbacks: success, reject and cancel params
 * @param mapping - do mapping of the response if needed
 * @return {*} - ajax request
 */
export function doRequest(requestParams, callbacks, mapping = null){
    let check = checkExpTime();
    if(check !== false){
        return check;
    }
    if(!requestParams.hasOwnProperty('url')){
        return doRequestRejected({'message': 'BAD_REQUEST', systemMessage: "There is no \'url param\' for the request"});
    }
    if(!callbacks.hasOwnProperty('success')){
        return doRequestRejected({'message': 'BAD_REQUEST', systemMessage: 'There is no "success handler" for the request'});
    }
    if(!callbacks.hasOwnProperty('reject')){
        return doRequestRejected({'message': 'BAD_REQUEST', systemMessage: 'There is no "reject handler" for the request'});
    }
    const requestSettings = getRequestSettings(requestParams);
    let {success, cancel, reject} = callbacks;
    let result;
    if(mapping === null) {
        result = ajax(requestSettings).map(res => res.response).map(success).catch(reject);
        if(typeof cancel !== 'undefined'){
            result = ajax(requestSettings).map(res => res.response).map(success).takeUntil(cancel).catch(reject);
        } else{
            result = ajax(requestSettings).map(res => res.response).map(success).catch(reject);
        }
    } else{
        if(typeof cancel !== 'undefined'){
            result = ajax(requestSettings).map(mapping).map(success).takeUntil(cancel).catch(reject);
        } else{
            result = ajax(requestSettings).map(mapping).map(success).catch(reject);
        }
    }
    return result;
}

/**
 * check if the expired time gone or not
 */
function checkExpTime(){
    const lastLogin = getCryptLS("last_login");
    const expTime = getCryptLS("exp_time") + 500;
    const sessionTime = getCryptLS("session_time") + 500;
    if (lastLogin !== null) {
        const currentLogin = Date.now();
        if(currentLogin - lastLogin >= sessionTime || currentLogin >= expTime) {
            //store.dispatch(sessionExpired());
            //history.push('/login');
            return Rx.Observable.of(logoutUserFulfilled({}));
        } else{
            setCryptLS("last_login", Date.now());
            if(sessionTimeout){
                clearTimeout(sessionTimeout);
            }
            //sessionTimeout = setTimeout(() => store.dispatch(sessionExpired({background: true})), sessionTime);
            return false;
        }
    }
    return false;
}