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
import {checkForUpdates} from "../redux_toolkit/action_creators/UpdateAssistantCreators";
import {setLoginInfo} from "@application/redux_toolkit/slices/AuthSlice";

export const updateAssistantMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    const dispatch: AppDispatch = storeApi.dispatch;
    if (login.fulfilled.type === action.type || setLoginInfo.type === action.type) {
        if (action.payload.userDetail.themeSync) {
            dispatch(checkForUpdates());
        }
    }
    return next(action);
}
