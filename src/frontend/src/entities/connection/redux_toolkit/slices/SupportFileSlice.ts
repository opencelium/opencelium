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
import { API_REQUEST_STATE } from "@application/interfaces/IApplication";
import { ICommonState } from "@application/interfaces/core";
import { CommonState } from "@application/utils/store";
import { IResponse } from "@application/requests/interfaces/IResponse";
import {SupportFileResponse} from "@root/requests/interfaces/ISupportFile";
import {
    deleteSupportFile, deleteSupportFiles,
    downloadSuccessSupportFile,
    downloadSupportFile, getSupportFiles,
    getSupportFilesByConnection
} from "@root/redux_toolkit/action_creators/SupportFileCreators";

export interface SupportFileState extends ICommonState{
    downloadingSupportFile: API_REQUEST_STATE,
    downloadingSuccessSupportFile: API_REQUEST_STATE,
    gettingSupportFilesByConnection: API_REQUEST_STATE,
    gettingSupportFiles: API_REQUEST_STATE,
    deletingSupportFile: API_REQUEST_STATE,
    deletingSupportFiles: API_REQUEST_STATE,
    currentSupportFileResponse: SupportFileResponse,
    supportFileResponses: SupportFileResponse[],
}
const initialState: SupportFileState = {
    downloadingSupportFile: API_REQUEST_STATE.INITIAL,
    downloadingSuccessSupportFile: API_REQUEST_STATE.INITIAL,
    gettingSupportFilesByConnection: API_REQUEST_STATE.INITIAL,
    gettingSupportFiles: API_REQUEST_STATE.INITIAL,
    deletingSupportFile: API_REQUEST_STATE.INITIAL,
    deletingSupportFiles: API_REQUEST_STATE.INITIAL,
    currentSupportFileResponse: undefined,
    supportFileResponses: [],
    ...CommonState,
}

export const supportFileSlice = createSlice({
    name: 'connection_support_file',
    initialState,
    reducers: {
        clearSupportFileResponses: (state) => {
            state.supportFileResponses = [];
        },
        notifyAboutNewSupportFile:  (state) => {
        },
    },
    extraReducers: {
        [downloadSupportFile.pending.type]: (state) => {
            state.downloadingSupportFile = API_REQUEST_STATE.START;
        },
        [downloadSupportFile.fulfilled.type]: (state) => {
            state.downloadingSupportFile = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [downloadSupportFile.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.downloadingSupportFile = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [downloadSuccessSupportFile.pending.type]: (state) => {
            state.downloadingSuccessSupportFile = API_REQUEST_STATE.START;
        },
        [downloadSuccessSupportFile.fulfilled.type]: (state) => {
            state.downloadingSuccessSupportFile = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [downloadSuccessSupportFile.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.downloadingSuccessSupportFile = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getSupportFilesByConnection.pending.type]: (state) => {
            state.gettingSupportFilesByConnection = API_REQUEST_STATE.START;
        },
        [getSupportFilesByConnection.fulfilled.type]: (state, action: PayloadAction<SupportFileResponse>) => {
            state.gettingSupportFilesByConnection = API_REQUEST_STATE.FINISH;
            state.currentSupportFileResponse = action.payload;
            state.error = null;
        },
        [getSupportFilesByConnection.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingSupportFilesByConnection = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getSupportFiles.pending.type]: (state) => {
            state.gettingSupportFiles = API_REQUEST_STATE.START;
        },
        [getSupportFiles.fulfilled.type]: (state, action: PayloadAction<SupportFileResponse[]>) => {
            state.gettingSupportFiles = API_REQUEST_STATE.FINISH;
            state.supportFileResponses = action.payload;
            state.error = null;
        },
        [getSupportFiles.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingSupportFilesByConnection = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteSupportFile.pending.type]: (state) => {
            state.deletingSupportFile= API_REQUEST_STATE.START;
        },
        [deleteSupportFile.fulfilled.type]: (state, action: PayloadAction<string>) => {
            state.deletingSupportFile= API_REQUEST_STATE.FINISH;
            state.supportFileResponses = state.supportFileResponses.filter(supportFile => supportFile.supportFile.indexOf(action.payload) === -1);
            state.error = null;
        },
        [deleteSupportFile.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingSupportFile = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteSupportFiles.pending.type]: (state) => {
            state.deletingSupportFiles= API_REQUEST_STATE.START;
        },
        [deleteSupportFiles.fulfilled.type]: (state, action: PayloadAction<string[]>) => {
            state.deletingSupportFiles= API_REQUEST_STATE.FINISH;
            state.supportFileResponses = state.supportFileResponses.filter(supportFile => action.payload.findIndex(path => supportFile.supportFile.indexOf(path) !== -1 ) === -1);
            state.error = null;
        },
        [deleteSupportFiles.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingSupportFiles = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    clearSupportFileResponses,notifyAboutNewSupportFile
} = supportFileSlice.actions;

export default supportFileSlice.reducer;
