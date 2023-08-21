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

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {API_REQUEST_STATE} from "../../interfaces/IApplication";
import {CommonState} from "../../utils/store";
import {ICommonState} from "../../interfaces/core";
import {IResponse} from "../../requests/interfaces/IResponse";
import {checkConnection} from "@application/redux_toolkit/action_creators/CheckConnectionCreators";


export interface CheckConnectionState extends ICommonState{
    checkingConnection: API_REQUEST_STATE,
}

const initialState: CheckConnectionState = {
    checkingConnection: API_REQUEST_STATE.INITIAL,
    ...CommonState,
}

export const checkConnectionSlice = createSlice({
    name: 'check_connection',
    initialState,
    reducers: {
    },
    extraReducers: {
        [checkConnection.pending.type]: (state) => {
            state.checkingConnection = API_REQUEST_STATE.START;
        },
        [checkConnection.fulfilled.type]: (state) => {
        },
        [checkConnection.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingConnection = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default checkConnectionSlice.reducer;
