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
    activateLicenseFile,
    activateLicenseString, deleteLicense,
    generateActivateRequest,
    getActivationRequestStatus,
    getLicenseStatus,
} from "@entity/license_management/redux_toolkit/action_creators/LicenseCreators";
import LicenseModel, {ActivationRequestStatus} from "@entity/license_management/requests/models/LicenseModel";

export interface LicenseState extends ICommonState{
    generatingActivateRequest: API_REQUEST_STATE,
    activatingLicense: API_REQUEST_STATE,
    gettingLicenseStatus: API_REQUEST_STATE,
    gettingActivationRequestStatus: API_REQUEST_STATE,
    deletingLicense: API_REQUEST_STATE,
    license: LicenseModel,
    status: boolean,
    activationRequestStatus: ActivationRequestStatus,
}

const initialState: LicenseState = {
    generatingActivateRequest: API_REQUEST_STATE.INITIAL,
    activatingLicense: API_REQUEST_STATE.INITIAL,
    gettingLicenseStatus: API_REQUEST_STATE.INITIAL,
    gettingActivationRequestStatus: API_REQUEST_STATE.INITIAL,
    deletingLicense: API_REQUEST_STATE.INITIAL,
    license: null,
    status: false,
    activationRequestStatus: ActivationRequestStatus.EXPIRED,
    ...CommonState,
}

export const licenseSlice = createSlice({
    name: 'license',
    initialState,
    reducers: {
    },
    extraReducers: {
        [generateActivateRequest.pending.type]: (state) => {
            state.generatingActivateRequest = API_REQUEST_STATE.START;
        },
        [generateActivateRequest.fulfilled.type]: (state, action: PayloadAction<LicenseModel>) => {
            state.generatingActivateRequest = API_REQUEST_STATE.FINISH;
            state.license = action.payload;
            state.activationRequestStatus = ActivationRequestStatus.PENDING;
            state.error = null;
        },
        [generateActivateRequest.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.generatingActivateRequest = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [activateLicenseString.pending.type]: (state) => {
            state.activatingLicense = API_REQUEST_STATE.START;
        },
        [activateLicenseString.fulfilled.type]: (state, action: PayloadAction<LicenseModel>) => {
            state.activatingLicense = API_REQUEST_STATE.FINISH;
            state.license = action.payload;
            state.error = null;
        },
        [activateLicenseString.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.activatingLicense = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [activateLicenseFile.pending.type]: (state) => {
            state.activatingLicense = API_REQUEST_STATE.START;
        },
        [activateLicenseFile.fulfilled.type]: (state, action: PayloadAction<LicenseModel>) => {
            state.activatingLicense = API_REQUEST_STATE.FINISH;
            state.license = action.payload;
            state.error = null;
        },
        [activateLicenseFile.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.activatingLicense = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getLicenseStatus.pending.type]: (state) => {
            state.gettingLicenseStatus = API_REQUEST_STATE.START;
        },
        [getLicenseStatus.fulfilled.type]: (state, action: PayloadAction<boolean>) => {
            state.gettingLicenseStatus = API_REQUEST_STATE.FINISH;
            state.status = action.payload;
            state.error = null;
        },
        [getLicenseStatus.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingLicenseStatus = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getActivationRequestStatus.pending.type]: (state) => {
            state.gettingActivationRequestStatus = API_REQUEST_STATE.START;
        },
        [getActivationRequestStatus.fulfilled.type]: (state, action: PayloadAction<ActivationRequestStatus>) => {
            state.gettingActivationRequestStatus = API_REQUEST_STATE.FINISH;
            state.activationRequestStatus = action.payload;
            state.error = null;
        },
        [getActivationRequestStatus.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingActivationRequestStatus = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteLicense.pending.type]: (state) => {
            state.deletingLicense = API_REQUEST_STATE.START;
        },
        [deleteLicense.fulfilled.type]: (state, action: PayloadAction<ActivationRequestStatus>) => {
            state.deletingLicense = API_REQUEST_STATE.FINISH;
            state.license = null;
            state.error = null;
        },
        [deleteLicense.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingLicense = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default licenseSlice.reducer;
