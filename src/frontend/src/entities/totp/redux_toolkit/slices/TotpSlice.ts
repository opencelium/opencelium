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
import LdapConfigModel from "@entity/ldap/requests/models/LdapConfigModel";
import {
    disableTotp,
    enableTotp,
    generateQRCode,
    loginTotp, validateTotp
} from "@entity/totp/redux_toolkit/action_creators/TotpCreators";

export interface TotpState extends ICommonState {
    generatingQRCode: API_REQUEST_STATE,
    enablingTotp: API_REQUEST_STATE,
    disablingTotp: API_REQUEST_STATE,
    loginingTotp: API_REQUEST_STATE,
    validatingTotp: API_REQUEST_STATE,
}

const initialState: TotpState = {
    generatingQRCode: API_REQUEST_STATE.INITIAL,
    enablingTotp: API_REQUEST_STATE.INITIAL,
    disablingTotp: API_REQUEST_STATE.INITIAL,
    loginingTotp: API_REQUEST_STATE.INITIAL,
    validatingTotp: API_REQUEST_STATE.INITIAL,
    ...CommonState,
}

export const totpSlice = createSlice({
    name: 'totp',
    initialState,
    reducers: {
    },
    extraReducers: {
        [generateQRCode.pending.type]: (state) => {
            state.generatingQRCode = API_REQUEST_STATE.START;
        },
        [generateQRCode.fulfilled.type]: (state, action: PayloadAction<LdapConfigModel>) => {
            state.generatingQRCode = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [generateQRCode.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.generatingQRCode = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [enableTotp.pending.type]: (state) => {
            state.enablingTotp = API_REQUEST_STATE.START;
        },
        [enableTotp.fulfilled.type]: (state, action: PayloadAction<LdapConfigModel>) => {
            state.enablingTotp = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [enableTotp.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.enablingTotp = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [disableTotp.pending.type]: (state) => {
            state.disablingTotp = API_REQUEST_STATE.START;
        },
        [disableTotp.fulfilled.type]: (state, action: PayloadAction<LdapConfigModel>) => {
            state.disablingTotp = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [disableTotp.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.disablingTotp = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [loginTotp.pending.type]: (state) => {
            state.loginingTotp = API_REQUEST_STATE.START;
        },
        [loginTotp.fulfilled.type]: (state, action: PayloadAction<LdapConfigModel>) => {
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
        [validateTotp.fulfilled.type]: (state, action: PayloadAction<LdapConfigModel>) => {
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
} = totpSlice.actions;

export default totpSlice.reducer;
