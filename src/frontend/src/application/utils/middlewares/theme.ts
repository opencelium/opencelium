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

import { Middleware } from 'redux'
import {RootState, store} from "@application/utils/store";
import {LocalStorage} from "@application/classes/LocalStorage";
import {setTheme} from '@application/redux_toolkit/slices/ApplicationSlice';

export const themeMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if (setTheme.match(action)) {
        const storage = LocalStorage.getStorage();
        if(storage.get('theme') !== action.payload){
            storage.set('theme', action.payload);
            const iframe = document.getElementById('iframe_messenger');
            if(iframe) {
                // @ts-ignore
                iframe.contentWindow.postMessage({
                    key: 'key',
                    value: action.payload,
                    method: 'opencelium_theme_store'
                }, '*');
            }
        }
    }
    return next(action);
}