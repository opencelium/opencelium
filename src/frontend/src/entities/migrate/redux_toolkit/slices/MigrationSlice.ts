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
import {ICommonState} from "@application/interfaces/core";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {CommonState} from "@application/utils/store";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {IInvoker} from "@entity/invoker/interfaces/IInvoker";
import {migrate} from "@entity/migrate/redux_toolkit/action_creators/MigrationCreators";

export interface MigrationState extends ICommonState{
    migrating: API_REQUEST_STATE,
}

const initialState: MigrationState = {
    migrating: API_REQUEST_STATE.INITIAL,
    ...CommonState,
}

export const migrationSlice = createSlice({
    name: 'migration',
    initialState,
    reducers: {
    },
    extraReducers: {
        [migrate.pending.type]: (state) => {
            state.migrating = API_REQUEST_STATE.START;
        },
        [migrate.fulfilled.type]: (state, action: PayloadAction<IInvoker[]>) => {
            state.migrating = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [migrate.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.migrating = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default migrationSlice.reducer;
