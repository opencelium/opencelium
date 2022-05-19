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
import {RootState} from "@application/utils/store";
import {LocalStorage} from "@application/classes/LocalStorage";
import { setConnectionViewType } from '../redux_toolkit/slices/ConnectionSlice';

export const connectionMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if(setConnectionViewType.type === action.type){
        const storage = LocalStorage.getStorage();
        storage.set('connectionViewType', action.payload);
    }
    return next(action);
}
