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

export interface ConnectionEditorState{
    isRequestBodyDialogOpened: boolean,
    isResponseSuccessDialogOpened: boolean,
    isResponseFailDialogOpened: boolean,
    isConditionDialogOpened: boolean,
}
const initialState: ConnectionEditorState = {
    isRequestBodyDialogOpened: false,
    isResponseSuccessDialogOpened: false,
    isResponseFailDialogOpened: false,
    isConditionDialogOpened: false,
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
})

export const {
    toggleRequestBodyDialog, toggleResponseSuccessBodyDialog,
    toggleResponseFailBodyDialog, toggleConditionDialog,
    syncInvokers,
} = connectionEditorSlice.actions;

export default connectionEditorSlice.reducer;
