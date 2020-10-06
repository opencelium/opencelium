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

import jwt from 'jsonwebtoken';
import {AuthAction} from '@utils/actions';
import {
    loginUserFulfilled, loginUserRejected,
    logoutUserFulfilled,
    updateAuthUserLanguageFulfilled, updateAuthUserLanguageRejected,
    updateDashboardSettingsFulfilled,
    updateThemeFulfilled, toggleAppTourFulfilled, toggleAppTourRejected, updateThemeRejected,
    checkOCConnectionFulfilled, checkOCConnectionRejected,
} from '@actions/auth';

import {doRequest} from '@utils/auth';
import {setLS} from "@utils/LocalStorage";
import {API_METHOD} from "@utils/constants/app";


/**
 * update language of the auth user
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const updateAuthUserLanguageEpic = (action$, store) => {
    return action$.ofType(AuthAction.UPDATE_AUTH_USER_LANGUAGE)
        .debounceTime(500)
        .mergeMap((action) => {
            let userId = store.getState('auth').get('auth').get('authUser').id;
            let url = 'user/changeLanguage';
            let data = {userId, currentLanguage: action.payload.currentLanguage};
            return doRequest({url, method: API_METHOD.PUT, data}, {
                success: updateAuthUserLanguageFulfilled,
                reject: updateAuthUserLanguageRejected
            });
        });
};

/**
 * login user
 */
 const loginUserEpic = (action$, store) => {
    return action$.ofType(AuthAction.LOG_IN)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = 'login';
            const {email, password} = action.payload;
            let data = {email, password};
            return doRequest({url, isApi: false, hasPlainText: true, method: API_METHOD.POST, data},{
                success: (({xhr, response}) => {
                    /*
                    * TODO: request for the ApplicationVersion
                    */
                    const token = xhr.getResponseHeader('authorization');
                    if(response !== null && response.hasOwnProperty('error')){
                        return loginUserFulfilled(response);
                    }
                    if(token !== null) {
                        const decodedData = jwt.decode(token.slice(7));
                        const expTime = decodedData.exp - decodedData.iat;
                        setLS("token", token);
                        setLS("exp_time", expTime);
                        setLS("last_login", Date.now());
                        setLS("userGroup", response.userGroup);
                        setLS("userDetail", response.userDetail);
                        decodedData['userGroup'] = response.userGroup;
                        decodedData['userDetail'] = response.userDetail;
                        return loginUserFulfilled(decodedData);
                    } else{
                        return loginUserRejected({'message': 'SERVER_NOT_FOUND'});
                    }
                }),
                reject: (ajax) => {
                    return loginUserRejected({'message': ajax.response && ajax.response.hasOwnProperty('error') && ajax.response.error === 'Bad credentials' ? 'WRONG_CREDENTIALS' : 'SERVER_NOT_FOUND'});
                },
                cancel: action$.ofType(AuthAction.LOG_IN_CANCELED)},
                res => {
                    return {xhr: res.xhr, response: res.response};
                });
        });
};

/**
 * logout user
 */
const logoutUserEpic = (action$, store) => {
    return action$.ofType(AuthAction.LOG_OUT)
        .debounceTime(500)
        .mergeMap((action) => {
            return logoutUserFulfilled({});
        });
};

/**
 * update dashboard settings
 */
const updateDashboardSettingsEpic = (action$, store) => {
    return action$.ofType(AuthAction.UPDATE_DASHBOARDSETTINGS)
        .debounceTime(500)
        .mergeMap((action) => {
            if(action.payload.dashboard.settings.url){
                return updateDashboardSettingsFulfilled(action.payload);
            }
            return updateDashboardSettingsFulfilled(action.payload);
        });
};

/**
 * update theme of the OC
 */
const updateThemeEpic = (action$, store) => {
    return action$.ofType(AuthAction.UPDATE_THEME)
        .debounceTime(500)
        .mergeMap((action) => {
            let authUser = action.payload;
            let url = `userDetail/${authUser.userId}`;
            let userDetail = Object.assign({}, authUser.userDetail, {theme: authUser.theme});
            authUser.userDetail = userDetail;
            return doRequest({url, method: API_METHOD.PUT, data: userDetail}, {
                    success: updateThemeFulfilled,
                    reject: updateThemeRejected,},
                res => {return authUser;}
            );
        });
};

/**
 * update application tour of the OC
 */
const toggleAppTourEpic = (action$, store) => {
    return action$.ofType(AuthAction.TOGGLE_APPTOUR)
        .debounceTime(500)
        .mergeMap((action) => {
            let {payload} = action;
            let url = `userDetail/${payload.userId}`;
            return doRequest({url, method: API_METHOD.PUT, data: payload.userDetail}, {
                success: toggleAppTourFulfilled,
                reject: toggleAppTourRejected,},
                res => {return payload.userDetail;}
            );
        });
};

/**
 * check OC connection
 */
const checkOCConnectionEpic = (action$, store) => {
    return action$.ofType(AuthAction.CHECK_OCCONNECTION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = 'application/oc/test';
            return doRequest({url}, {
                    success: checkOCConnectionFulfilled,
                    reject: checkOCConnectionRejected
            });
        });
};


export {
    updateAuthUserLanguageEpic,
    loginUserEpic,
    logoutUserEpic,
    updateDashboardSettingsEpic,
    updateThemeEpic,
    toggleAppTourEpic,
    checkOCConnectionEpic,
};