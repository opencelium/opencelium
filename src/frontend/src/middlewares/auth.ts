import { Middleware } from 'redux'

import { logout } from '@slice/application/AuthSlice';
import {AppDispatch, RootState} from "@store/store";
import {login, updateAuthUserDetail} from "@action/application/AuthCreators";
import {LocalStorage} from "@class/../classes/application/LocalStorage";
import {IResponse, ResponseMessages} from "@requestInterface/application/IResponse";
import {getResources, getVersion} from "@action/application/ApplicationCreators";
import {checkForUpdates} from "@action/application/UpdateAssistantCreators";

export const authMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    const dispatch: AppDispatch = storeApi.dispatch;
    const actionTypeSplit = action.type.split('/');
    const isRequestRejected = actionTypeSplit[actionTypeSplit.length - 1] === 'rejected';
    let isAccessDenied = false;
    if(isRequestRejected){
        const response: IResponse = action.payload;
        isAccessDenied = response?.status === 401 || (response?.status === 500 && response?.message === ResponseMessages.UNSUPPORTED_HEADER_AUTH_TYPE) || false;
    }
    if(isAccessDenied){
        const authState = storeApi.getState().authReducer;
        if(authState.isAuth){
            return next(logout());
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
