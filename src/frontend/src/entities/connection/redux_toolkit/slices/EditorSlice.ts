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
import { requestRemoteApi } from "../action_creators/EditorCreators";
import { API_REQUEST_STATE } from "@application/interfaces/IApplication";
import { RemoteApiResponseProps } from "@application/requests/interfaces/IApplication";
import { ICommonState } from "@application/interfaces/core";
import { CommonState } from "@application/utils/store";
import { IResponse } from "@application/requests/interfaces/IResponse";

export interface ConnectionEditorState extends ICommonState{
    requestingRemoteApi: API_REQUEST_STATE,
    remoteApiData: RemoteApiResponseProps,
    isRequestBodyDialogOpened: boolean,
    isResponseSuccessDialogOpened: boolean,
    isResponseFailDialogOpened: boolean,
    isConditionDialogOpened: boolean,
}
const initialState: ConnectionEditorState = {
    requestingRemoteApi: API_REQUEST_STATE.INITIAL,
    remoteApiData: null,
    isRequestBodyDialogOpened: false,
    isResponseSuccessDialogOpened: false,
    isResponseFailDialogOpened: false,
    isConditionDialogOpened: false,
    ...CommonState,
}

export const connectionEditorSlice = createSlice({
    name: 'connection_editor',
    initialState,
    reducers: {
        toggleRequestBodyDialog: (state) => {
            state.isRequestBodyDialogOpened = !state.isRequestBodyDialogOpened;
        },
        toggleResponseSuccessBodyDialog: (state) => {
            state.isResponseSuccessDialogOpened = !state.isResponseSuccessDialogOpened;
        },
        toggleResponseFailBodyDialog: (state) => {
            state.isResponseFailDialogOpened = !state.isResponseFailDialogOpened;
        },
        toggleConditionDialog: (state) => {
            state.isConditionDialogOpened = !state.isConditionDialogOpened;
        },
        syncInvokers: (state) => {

        }
    },
    extraReducers: {
        [requestRemoteApi.pending.type]: (state) => {
            state.requestingRemoteApi = API_REQUEST_STATE.START;
            state.remoteApiData = null;
        },
        [requestRemoteApi.fulfilled.type]: (state, action: PayloadAction<RemoteApiResponseProps>) => {
            state.requestingRemoteApi = API_REQUEST_STATE.FINISH;
            state.remoteApiData = action.payload;
            state.error = null;
        },
        [requestRemoteApi.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.requestingRemoteApi = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    toggleRequestBodyDialog, toggleResponseSuccessBodyDialog,
    toggleResponseFailBodyDialog, toggleConditionDialog,
    syncInvokers,
} = connectionEditorSlice.actions;

export default connectionEditorSlice.reducer;
