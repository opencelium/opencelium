/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import { Middleware } from 'redux'
import {logout, setLoginInfo} from '@application/redux_toolkit/slices/AuthSlice';
import {AppDispatch, RootState} from "@application/utils/store";
import {login} from "@application/redux_toolkit/action_creators/AuthCreators";
import {LocalStorage} from "@application/classes/LocalStorage";
import {IResponse, ResponseMessages} from "@application/requests/interfaces/IResponse";
import {LogoutProps} from "@application/interfaces/IAuth";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {clearCurrentPages, clearSearchFields } from '@application/redux_toolkit/slices/ApplicationSlice';
import {clearWidgetSettings} from "@entity/dashboard/redux_toolkit/slices/WidgetSettingSlice";
import { checkConnection } from '@application/redux_toolkit/action_creators/CheckConnectionCreators';
import {checkMongoDB} from "@entity/external_application/redux_toolkit/action_creators/ExternalApplicationCreators";
import {validateTotp} from "@entity/totp/redux_toolkit/action_creators/TotpCreators";
import {setQrCode, setSecretKey} from "@entity/totp/redux_toolkit/slices/TotpSlice";

export const checkAccess = (storeApi: any, action: any) => {
    const response: IResponse = action.payload;
    const applicationState = storeApi.getState().applicationReducer;
    return applicationState.openingExternalUrl !== API_REQUEST_STATE.START && (response?.status === 403 || response?.message === ResponseMessages.ACCESS_DENIED || response?.message === ResponseMessages.UNSUPPORTED_HEADER_AUTH_TYPE || response?.message === ResponseMessages.TOKEN_IS_NOT_VALID || (response?.message === ResponseMessages.NETWORK_ERROR && login.rejected.type === action.type) || false);
}

export const authMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    const dispatch: AppDispatch = storeApi.dispatch;
    const actionTypeSplit = action.type.split('/');
    const isRequestRejected = actionTypeSplit[actionTypeSplit.length - 1] === 'rejected' && checkConnection.rejected.type !== action.type;
    let isAccessDenied = false;
    const response: IResponse = action.payload;
    if(isRequestRejected){
        isAccessDenied = checkAccess(storeApi, action);
    }
    if(isAccessDenied){
        const authState = storeApi.getState().authReducer;
        if(authState.isAuth){
            const logoutProps: LogoutProps = {wasAccessDenied: true, message: response?.message || ''};
            dispatch(logout(logoutProps));
        }
    }
    if (validateTotp.fulfilled.type === action.type) {
        dispatch(setLoginInfo(action.payload));
    }
    if (login.fulfilled.type === action.type || setLoginInfo.type === action.type) {
        const storage = LocalStorage.getStorage(true);
        storage.set('authUser', action.payload);
        dispatch(checkConnection());
        dispatch(setQrCode(''));
        dispatch(setSecretKey(''));
        setTimeout(() => dispatch(checkMongoDB()), 1000);
    } else if (logout.match(action)) {
        const SecuredStorage = LocalStorage.getStorage(true);
        SecuredStorage.remove('authUser');
        const OpenedStorage = LocalStorage.getStorage();
        OpenedStorage.remove('appVersion');
        dispatch(clearSearchFields({}));
        dispatch(clearCurrentPages({}));
        dispatch(clearWidgetSettings());
    }
    return next(action);
}
