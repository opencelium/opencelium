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
import {updateUserDetail} from "../redux-toolkit/action_creators/UserDetailCreators";

const userDetailMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if (updateUserDetail.fulfilled.type === action.type) {
        const storage = LocalStorage.getStorage(true);
        storage.set('authUser', action.payload);
    }
    return next(action);
}

export default userDetailMiddleware;