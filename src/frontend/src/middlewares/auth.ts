/*
 * Copyright (C) <2022>  <becon GmbH>
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

import { Middleware } from 'redux'

import { logout } from '@slice/application/AuthSlice';
import {AppDispatch, RootState} from "@store/store";
import {login, updateAuthUserDetail} from "@action/application/AuthCreators";
import {LocalStorage} from "@class/../classes/application/LocalStorage";
import {IResponse, ResponseMessages} from "@requestInterface/application/IResponse";
import {getResources, getVersion} from "@action/application/ApplicationCreators";
import {checkForUpdates} from "@action/application/UpdateAssistantCreators";
import {LogoutProps} from "@interface/application/IAuth";
import {API_REQUEST_STATE} from "@interface/application/IApplication";

export const authMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    const dispatch: AppDispatch = storeApi.dispatch;
    const actionTypeSplit = action.type.split('/');
    const isRequestRejected = actionTypeSplit[actionTypeSplit.length - 1] === 'rejected';
    let isAccessDenied = false;
    const response: IResponse = action.payload;
    if(isRequestRejected){
        const applicationState = storeApi.getState().applicationReducer;
        isAccessDenied = applicationState.openingExternalUrl !== API_REQUEST_STATE.START && (response?.status === 403 || response?.message === ResponseMessages.UNSUPPORTED_HEADER_AUTH_TYPE || response?.message === ResponseMessages.NETWORK_ERROR || false);
    }
    if(isAccessDenied){
        const authState = storeApi.getState().authReducer;
        if(authState.isAuth){
            const logoutProps: LogoutProps = {wasAccessDenied: true, message: response?.message || ''};
            dispatch(logout(logoutProps));
        }
    }
    if (login.fulfilled.type === action.type || updateAuthUserDetail.fulfilled.type === action.type) {
        const storage = LocalStorage.getStorage(true);
        storage.set('authUser', action.payload);
        if(login.fulfilled.type === action.type) {
            dispatch(getVersion());
            dispatch(getResources());
            dispatch(checkForUpdates());
        }
    } else if (logout.match(action)) {
        const SecuredStorage = LocalStorage.getStorage(true);
        SecuredStorage.remove('authUser');
        const OpenedStorage = LocalStorage.getStorage();
        OpenedStorage.remove('appVersion');
    }
    return next(action);
}
