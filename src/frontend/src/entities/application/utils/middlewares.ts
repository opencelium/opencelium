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
import {login} from "@application/redux_toolkit/action_creators/AuthCreators";
import {LocalStorage} from "@application/classes/LocalStorage";
import {getResources, getVersion} from "@application/redux_toolkit/action_creators/ApplicationCreators";
import {setThemes} from "@application/redux_toolkit/slices/ApplicationSlice";
import IAuthUser from "@entity/user/interfaces/IAuthUser";
import {updateAuthUser} from "@application/redux_toolkit/slices/AuthSlice";

export const applicationMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if (login.fulfilled.type === action.type) {
        const dispatch: AppDispatch = storeApi.dispatch;
        const storage = LocalStorage.getStorage(true);
        storage.set('authUser', action.payload);
        dispatch(getVersion());
        dispatch(getResources());
    }
    if (setThemes.match(action)) {
        const SecStorage = LocalStorage.getStorage(true);
        const authUser = SecStorage.get('authUser');
        const storage = LocalStorage.getStorage();
        if (storage.get('themes') !== action.payload) {
            storage.set('themes', action.payload);
            if(authUser.userDetail.themeSync) {
                const iframe = document.getElementById('iframe_messenger');
                if (iframe) {
                    // @ts-ignore
                    const contentWindow = iframe.contentWindow;
                    contentWindow.postMessage({
                        key: 'key',
                        value: action.payload,
                        method: 'opencelium_themes_store'
                    }, '*');
                }
            }
        }
    }
    return next(action);
}
