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

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {ICommonState} from "@application/interfaces/core";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {CommonState} from "@application/utils/store";
import {IResponse} from "@application/requests/interfaces/IResponse";
import IAuthUser from "../../interfaces/IAuthUser";
import {updateUserDetail} from "../../redux-toolkit/action_creators/UserDetailCreators";

export interface AuthState extends ICommonState{
    updatingUserDetail: API_REQUEST_STATE,
}
const initialState: AuthState = {
    updatingUserDetail: API_REQUEST_STATE.INITIAL,
    ...CommonState,
}

export const userDetailSlice = createSlice({
    name: 'userDetail',
    initialState,
    reducers: {
    },
    extraReducers: {
        [updateUserDetail.pending.type]: (state) => {
            state.updatingUserDetail = API_REQUEST_STATE.START;
        },
        [updateUserDetail.fulfilled.type]: (state, action: PayloadAction<IAuthUser>) => {
            state.updatingUserDetail = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [updateUserDetail.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingUserDetail = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default userDetailSlice.reducer;