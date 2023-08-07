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

import {createSlice} from "@reduxjs/toolkit";

export interface ConnectionEditorState{
    isBodyDialogOpened: boolean,
    isConditionDialogOpened: boolean,
}
const initialState: ConnectionEditorState = {
    isBodyDialogOpened: false,
    isConditionDialogOpened: false,
}

export const connectionEditorSlice = createSlice({
    name: 'connection_editor',
    initialState,
    reducers: {
        toggleBodyDialog: (state) => {
            state.isBodyDialogOpened = !state.isBodyDialogOpened;
        },
        toggleConditionDialog: (state) => {
            state.isConditionDialogOpened = !state.isConditionDialogOpened;
        },
    },
})

export const {
    toggleBodyDialog, toggleConditionDialog,
} = connectionEditorSlice.actions;

export default connectionEditorSlice.reducer;
