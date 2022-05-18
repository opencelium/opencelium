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
import { logout } from '@application/redux_toolkit/slices/AuthSlice';
import {AppDispatch, RootState} from "@application/utils/store";
import {login} from "@application/redux_toolkit/action_creators/AuthCreators";
import {LocalStorage} from "@application/classes/LocalStorage";
import {IResponse, ResponseMessages} from "@application/requests/interfaces/IResponse";
import {LogoutProps} from "@application/interfaces/IAuth";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

export const authMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    const dispatch: AppDispatch = storeApi.dispatch;
    const actionTypeSplit = action.type.split('/');
    const isRequestRejected = actionTypeSplit[actionTypeSplit.length - 1] === 'rejected';
    let isAccessDenied = false;
    const response: IResponse = action.payload;
    if(isRequestRejected){
        const applicationState = storeApi.getState().applicationReducer;
        isAccessDenied = applicationState.openingExternalUrl !== API_REQUEST_STATE.START && (response?.status === 403 || response?.message === ResponseMessages.ACCESS_DENIED || response?.message === ResponseMessages.UNSUPPORTED_HEADER_AUTH_TYPE || (response?.message === ResponseMessages.NETWORK_ERROR && login.rejected.type === action.type) || false);
    }
    if(isAccessDenied){
        const authState = storeApi.getState().authReducer;
        if(authState.isAuth){
            const logoutProps: LogoutProps = {wasAccessDenied: true, message: response?.message || ''};
            dispatch(logout(logoutProps));
        }
    }
    if (login.fulfilled.type === action.type) {
        const storage = LocalStorage.getStorage(true);
        storage.set('authUser', action.payload);
    } else if (logout.match(action)) {
        const SecuredStorage = LocalStorage.getStorage(true);
        SecuredStorage.remove('authUser');
        const OpenedStorage = LocalStorage.getStorage();
        OpenedStorage.remove('appVersion');
    }
    return next(action);
}
