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
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {CommonState} from "@application/utils/store";
import {ICommonState} from "@application/interfaces/core";
import {IApplicationResponse, IResponse} from "@application/requests/interfaces/IResponse";
import {
    checkApplicationBeforeUpdate,
    deleteApplicationFile,
    checkForUpdates,
    getOfflineUpdates,
    updateApplication,
    uploadApplicationFile,
    getOnlineUpdates,
    uploadOnlineVersion, downloadOnlineVersion, getInstallationInfo
} from "@entity/update_assistant/redux_toolkit/action_creators/UpdateAssistantCreators";
import {
    CheckForUpdateProps, InstallationInfo, VersionProps,
} from "@application/requests/interfaces/IUpdateAssistant";

export interface AuthState extends ICommonState{
    gettingInstallationInfo: API_REQUEST_STATE,
    uploadingOnlineVersion: API_REQUEST_STATE,
    downloadingOnlineVersion: API_REQUEST_STATE,
    gettingOnlineUpdates: API_REQUEST_STATE,
    gettingOfflineUpdates: API_REQUEST_STATE,
    uploadingApplicationFile: API_REQUEST_STATE,
    deletingApplicationFile: API_REQUEST_STATE,
    checkingApplicationBeforeUpdate: API_REQUEST_STATE,
    updatingApplication: API_REQUEST_STATE,
    gettingLastAvailableVersion: API_REQUEST_STATE,
    installationInfo: InstallationInfo,
    lastAvailableVersion: string,
    downloadedOnlineUpdate: VersionProps;
    onlineUpdates: any[],
    offlineUpdates: any[],
    checkResetFiles: any,
    hasUpdates: boolean,
}

const initialState: AuthState = {
    gettingInstallationInfo: API_REQUEST_STATE.INITIAL,
    uploadingOnlineVersion: API_REQUEST_STATE.INITIAL,
    downloadingOnlineVersion: API_REQUEST_STATE.INITIAL,
    gettingOnlineUpdates: API_REQUEST_STATE.INITIAL,
    gettingOfflineUpdates: API_REQUEST_STATE.INITIAL,
    uploadingApplicationFile: API_REQUEST_STATE.INITIAL,
    deletingApplicationFile: API_REQUEST_STATE.INITIAL,
    checkingApplicationBeforeUpdate: API_REQUEST_STATE.INITIAL,
    updatingApplication: API_REQUEST_STATE.INITIAL,
    gettingLastAvailableVersion: API_REQUEST_STATE.INITIAL,
    installationInfo: null,
    downloadedOnlineUpdate: null,
    onlineUpdates: [],
    offlineUpdates: [],
    checkResetFiles: null,
    lastAvailableVersion: '',
    hasUpdates: false,
    ...CommonState,
}

export const updateAssistantSlice = createSlice({
    name: 'update_assistant',
    initialState,
    reducers: {
    },
    extraReducers: {
        [getInstallationInfo.pending.type]: (state) => {
            state.gettingInstallationInfo = API_REQUEST_STATE.START;
        },
        [getInstallationInfo.fulfilled.type]: (state, action: PayloadAction<InstallationInfo>) => {
            state.gettingInstallationInfo = API_REQUEST_STATE.FINISH;
            state.installationInfo = action.payload;
            state.error = null;
        },
        [getInstallationInfo.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingInstallationInfo = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [uploadOnlineVersion.pending.type]: (state) => {
            state.uploadingOnlineVersion = API_REQUEST_STATE.START;
        },
        [uploadOnlineVersion.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.uploadingOnlineVersion = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [uploadOnlineVersion.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.uploadingOnlineVersion = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [downloadOnlineVersion.pending.type]: (state) => {
            state.downloadingOnlineVersion = API_REQUEST_STATE.START;
        },
        [downloadOnlineVersion.fulfilled.type]: (state, action: PayloadAction<VersionProps>) => {
            state.downloadingOnlineVersion = API_REQUEST_STATE.FINISH;
            state.downloadedOnlineUpdate = action.payload;
            state.error = null;
        },
        [downloadOnlineVersion.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.downloadingOnlineVersion = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [checkForUpdates.pending.type]: (state) => {
            state.gettingLastAvailableVersion = API_REQUEST_STATE.START;
        },
        [checkForUpdates.fulfilled.type]: (state, action: PayloadAction<IApplicationResponse<CheckForUpdateProps>>) => {
            state.gettingLastAvailableVersion = API_REQUEST_STATE.FINISH;
            state.lastAvailableVersion = action.payload.data.version;
            state.hasUpdates = action.payload.data.hasUpdates;
            state.error = null;
        },
        [checkForUpdates.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingLastAvailableVersion = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getOnlineUpdates.pending.type]: (state) => {
            state.gettingOnlineUpdates = API_REQUEST_STATE.START;
        },
        [getOnlineUpdates.fulfilled.type]: (state, action: PayloadAction<VersionProps[]>) => {
            state.gettingOnlineUpdates = API_REQUEST_STATE.FINISH;
            state.onlineUpdates = action.payload;
            state.error = null;
        },
        [getOnlineUpdates.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingOnlineUpdates = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getOfflineUpdates.pending.type]: (state) => {
            state.gettingOfflineUpdates = API_REQUEST_STATE.START;
        },
        [getOfflineUpdates.fulfilled.type]: (state, action: PayloadAction<VersionProps[]>) => {
            state.gettingOfflineUpdates = API_REQUEST_STATE.FINISH;
            state.offlineUpdates = action.payload;
            state.error = null;
        },
        [getOfflineUpdates.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingOfflineUpdates = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [uploadApplicationFile.pending.type]: (state) => {
            state.uploadingApplicationFile = API_REQUEST_STATE.START;
        },
        [uploadApplicationFile.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.uploadingApplicationFile = API_REQUEST_STATE.FINISH;
            state.offlineUpdates.push(action.payload);
            state.error = null;
        },
        [uploadApplicationFile.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.uploadingApplicationFile = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteApplicationFile.pending.type]: (state) => {
            state.deletingApplicationFile = API_REQUEST_STATE.START;
        },
        [deleteApplicationFile.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingApplicationFile = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [deleteApplicationFile.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingApplicationFile = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [checkApplicationBeforeUpdate.pending.type]: (state) => {
            state.checkingApplicationBeforeUpdate = API_REQUEST_STATE.START;
        },
        [checkApplicationBeforeUpdate.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingApplicationBeforeUpdate = API_REQUEST_STATE.FINISH;
            state.checkResetFiles = action.payload;
            state.error = null;
        },
        [checkApplicationBeforeUpdate.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingApplicationBeforeUpdate = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateApplication.pending.type]: (state) => {
            state.updatingApplication = API_REQUEST_STATE.START;
        },
        [updateApplication.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingApplication = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [updateApplication.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingApplication = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default updateAssistantSlice.reducer;
