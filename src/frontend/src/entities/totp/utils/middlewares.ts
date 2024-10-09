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
import {AppDispatch, RootState} from "@application/utils/store";
import {LocalStorage} from "@application/classes/LocalStorage";
import { updateAuthUser } from '@application/redux_toolkit/slices/AuthSlice';
import {disableTotp, enableTotp} from "@entity/totp/redux_toolkit/action_creators/TotpCreators";
import {login} from "@application/redux_toolkit/action_creators/AuthCreators";
import {setQrCode, setSecretKey} from "@entity/totp/redux_toolkit/slices/TotpSlice";

const userDetailMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    const dispatch: AppDispatch = storeApi.dispatch;
    if (enableTotp.fulfilled.type === action.type) {
        const authState = storeApi.getState().authReducer;
        const authUser = {...authState.authUser};
        authUser.totpEnabled = true;
        const storage = LocalStorage.getStorage(true);
        storage.set('authUser', authUser);
        dispatch(updateAuthUser(authUser));
    }
    if (disableTotp.fulfilled.type === action.type) {
        const authState = storeApi.getState().authReducer;
        const authUser = {...authState.authUser};
        authUser.totpEnabled = false;
        const storage = LocalStorage.getStorage(true);
        storage.set('authUser', authUser);
        dispatch(updateAuthUser(authUser));
    }
    if (login.rejected.type === action.type) {
        if (action.payload.qr) {
            dispatch(setQrCode(action.payload.qr));
        }
        if (action.payload.secretKey) {
            dispatch(setSecretKey(action.payload.secretKey));
        }
    }
    return next(action);
}

export default userDetailMiddleware;
