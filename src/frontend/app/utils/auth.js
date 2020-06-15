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
import jwt from 'jsonwebtoken';

import store from '@utils/store';
import {loginUserFulfilled, sessionExpired} from '@actions/auth';
import {doRequestRejected} from '@actions/app';
import {updateMenu} from '@actions/app';

import {setLS, getLS} from '@utils/LocalStorage';
import {baseUrl, baseUrlApi} from '@utils/constants/url';
import {history} from '@components/App';
import {AuthAction} from "@utils/actions";

const {ajax} = Rx.Observable;


/**
 * set settings for each request
 */
export function getRequestSettings(params){
    let settings = {};
    let {url, method, data, isApi, contentType, fullUrl, isIframeUrl, hasAuthHeader} = params;
    if(typeof hasAuthHeader === 'undefined'){
        hasAuthHeader = false;
    }
    if(typeof isApi === 'undefined'){
        isApi = true;
    }
    if(typeof isIframeUrl === 'undefined'){
        isIframeUrl = false;
    }
    if(fullUrl !== true){
        url = isApi ? baseUrlApi + url : baseUrl + url;
    }
    method = typeof method === 'undefined' ? 'get' : method;
    if(typeof data === 'undefined'){
        data = {};
    }
    settings.url = url;
    settings.method = method;
    settings.crossDomain = true;
    settings.headers = {};
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
        settings.headers['Authorization'] = getLS('token');
    }
    switch(method){
        case 'post':
            settings.body = data;
            break;
        case 'get':
            settings.body = data;
            break;
        case 'put':
            settings.body = data;
            break;
        case 'delete':
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
    const lastLogin = getLS("last_login");
    const expTime = getLS("exp_time");
    if (lastLogin !== null) {
        const currentLogin = Date.now();
        if(currentLogin - lastLogin < expTime) {
            setLS("last_login", Date.now());
            return false;
        } else{
            store.dispatch(sessionExpired({}));
            history.push('/login');
            return Rx.Observable.of({
                type: AuthAction.INITIAL_STATE,
                payload: {},
            });
        }
    }
    return false;
}

/**
 * gather auth params from store if authorized
 */
export function setAuthSettings(){
    checkExpTime();
    if(getLS('token')) {
        const token = getLS('token');
        const userGroup = getLS('userGroup');
        const userDetail = getLS('userDetail');
        const decodedData = jwt.decode(token.slice(7));
        decodedData['userGroup'] = userGroup;
        decodedData['userDetail'] = userDetail;
        store.dispatch(loginUserFulfilled(decodedData));
        store.dispatch(updateMenu(getLS('currentMenu')));
    }
}