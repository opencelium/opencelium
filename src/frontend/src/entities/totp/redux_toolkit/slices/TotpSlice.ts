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
import {
    disableTotp,
    enableTotp, enableUsersTotp,
    loginTotp, validateTotp
} from "@entity/totp/redux_toolkit/action_creators/TotpCreators";

export interface TotpState extends ICommonState {
    togglingTotp: API_REQUEST_STATE,
    enablingUsersTotp: API_REQUEST_STATE,
    loginingTotp: API_REQUEST_STATE,
    validatingTotp: API_REQUEST_STATE,
    qrCode: string,
    secretKey: string,
}

const initialState: TotpState = {
    togglingTotp: API_REQUEST_STATE.INITIAL,
    enablingUsersTotp: API_REQUEST_STATE.INITIAL,
    loginingTotp: API_REQUEST_STATE.INITIAL,
    validatingTotp: API_REQUEST_STATE.INITIAL,
    qrCode: '',
    secretKey: '',
    ...CommonState,
}

export const totpSlice = createSlice({
    name: 'totp',
    initialState,
    reducers: {
        setQrCode: (state, action: PayloadAction<string>) => {
            state.qrCode = action.payload;
        },
        setSecretKey: (state, action: PayloadAction<string>) => {
            state.secretKey = action.payload;
        },
    },
    extraReducers: {
        [enableUsersTotp.pending.type]: (state) => {
            state.enablingUsersTotp = API_REQUEST_STATE.START;
        },
        [enableUsersTotp.fulfilled.type]: (state, action: PayloadAction<number[]>) => {
            state.enablingUsersTotp = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [enableUsersTotp.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.enablingUsersTotp = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [enableTotp.pending.type]: (state) => {
            state.togglingTotp = API_REQUEST_STATE.START;
        },
        [enableTotp.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.togglingTotp = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [enableTotp.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.togglingTotp = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [disableTotp.pending.type]: (state) => {
            state.togglingTotp = API_REQUEST_STATE.START;
        },
        [disableTotp.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.togglingTotp = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [disableTotp.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.togglingTotp = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [loginTotp.pending.type]: (state) => {
            state.loginingTotp = API_REQUEST_STATE.START;
        },
        [loginTotp.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.loginingTotp = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [loginTotp.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.loginingTotp = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [validateTotp.pending.type]: (state) => {
            state.validatingTotp = API_REQUEST_STATE.START;
        },
        [validateTotp.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.validatingTotp = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [validateTotp.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.validatingTotp = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    setQrCode, setSecretKey,
} = totpSlice.actions;

export default totpSlice.reducer;
