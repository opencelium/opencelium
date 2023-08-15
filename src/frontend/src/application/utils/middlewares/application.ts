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
import {checkConnection, getLogoName, getVersion} from "@application/redux_toolkit/action_creators/ApplicationCreators";
import {ApplicationVersionResponseProps} from "@application/requests/interfaces/IApplication";
import {
    setCurrentPages,
    setGridViewType,
    setSearchFields,
    setThemes,
    setViewType
} from '@application/redux_toolkit/slices/ApplicationSlice';
import IAuthUser from "@entity/user/interfaces/IAuthUser";
import {updateAuthUser} from "@application/redux_toolkit/slices/AuthSlice";
import {getThemesFromServicePortal, saveThemesInServicePortal} from "@entity/application/utils/utils";
import {checkAccess} from "@application/utils/middlewares/auth";

export const applicationMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if (getLogoName.fulfilled.type === action.type) {
        const storage = LocalStorage.getStorage(true);
        let authUser: IAuthUser = {...storage.get('authUser')};
        authUser.logoName = action.payload;
        storage.set('authUser', authUser);
        const dispatch: AppDispatch = storeApi.dispatch;
        dispatch(updateAuthUser(authUser));
    }
    if(setThemes.type === action.type){
        saveThemesInServicePortal(action.payload);
    }
    if(getVersion.fulfilled.type === action.type){
        const versionResponse: ApplicationVersionResponseProps = action.payload;
        const storage = LocalStorage.getStorage();
        storage.set('appVersion', versionResponse.version);
    }
    if(setViewType.type === action.type){
        const storage = LocalStorage.getStorage();
        storage.set('viewType', action.payload);
    }
    if(setGridViewType.type === action.type){
        const storage = LocalStorage.getStorage();
        storage.set('gridViewType', action.payload);
    }
    if(setSearchFields.type === action.type){
        const storage = LocalStorage.getStorage();
        const searchFields = storage.get('searchFields') || {};
        storage.set('searchFields', {...searchFields, ...action.payload});
    }
    if(setCurrentPages.type === action.type){
        const storage = LocalStorage.getStorage();
        const currentPages = storage.get('currentPages') || {};
        storage.set('currentPages', {...currentPages, ...action.payload});
    }
    return next(action);
}
