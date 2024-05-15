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
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {CommonState} from "@application/utils/store";
import {ICommonState} from "@application/interfaces/core";
import {IResponse, ResponseMessages} from "@application/requests/interfaces/IResponse";
import {ITemplate} from "@entity/connection/interfaces/ITemplate";
import {
    addTemplate,
    checkTemplateName,
    deleteTemplateById,
    deleteTemplatesById,
    exportTemplate,
    getAllTemplates,
    getTemplateByConnectionId,
    getTemplateById,
    getTemplatesByConnectors,
    importTemplate,
    updateTemplate,
    updateTemplates,
} from "../action_creators/TemplateCreators";

export interface TemplateState extends ICommonState{
    templates: ITemplate[],
    isCurrentTemplateHasUniqueName: TRIPLET_STATE,
    checkingTemplateName: API_REQUEST_STATE,
    importingTemplate: API_REQUEST_STATE,
    exportingTemplate: API_REQUEST_STATE,
    addingTemplate: API_REQUEST_STATE,
    updatingTemplate: API_REQUEST_STATE,
    updatingTemplates: API_REQUEST_STATE,
    gettingTemplate: API_REQUEST_STATE,
    gettingTemplateByConnectionId: API_REQUEST_STATE,
    gettingTemplates: API_REQUEST_STATE,
    deletingTemplateById: API_REQUEST_STATE,
    deletingTemplatesById: API_REQUEST_STATE,
    currentTemplate: ITemplate,
}

const initialState: TemplateState = {
    templates: [],
    isCurrentTemplateHasUniqueName: TRIPLET_STATE.INITIAL,
    checkingTemplateName: API_REQUEST_STATE.INITIAL,
    importingTemplate: API_REQUEST_STATE.INITIAL,
    exportingTemplate: API_REQUEST_STATE.INITIAL,
    addingTemplate: API_REQUEST_STATE.INITIAL,
    updatingTemplate: API_REQUEST_STATE.INITIAL,
    updatingTemplates: API_REQUEST_STATE.INITIAL,
    gettingTemplate: API_REQUEST_STATE.INITIAL,
    gettingTemplateByConnectionId: API_REQUEST_STATE.INITIAL,
    gettingTemplates: API_REQUEST_STATE.INITIAL,
    deletingTemplateById: API_REQUEST_STATE.INITIAL,
    deletingTemplatesById: API_REQUEST_STATE.INITIAL,
    currentTemplate: null,
    ...CommonState,
}

export const templateSlice = createSlice({
    name: 'template',
    initialState,
    reducers: {
    },
    extraReducers: {
        [checkTemplateName.pending.type]: (state) => {
            state.checkingTemplateName = API_REQUEST_STATE.START;
            state.isCurrentTemplateHasUniqueName = TRIPLET_STATE.INITIAL;
        },
        [checkTemplateName.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingTemplateName = API_REQUEST_STATE.FINISH;
            state.isCurrentTemplateHasUniqueName = action.payload.message === ResponseMessages.NOT_EXISTS ? TRIPLET_STATE.TRUE : TRIPLET_STATE.FALSE;
            state.error = null;
        },
        [checkTemplateName.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingTemplateName = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [importTemplate.pending.type]: (state, action: PayloadAction<ITemplate>) => {
            state.importingTemplate = API_REQUEST_STATE.START;
        },
        [importTemplate.fulfilled.type]: (state, action: PayloadAction<ITemplate>) => {
            state.importingTemplate = API_REQUEST_STATE.FINISH;
            state.templates.push(action.payload);
            state.error = null;
        },
        [importTemplate.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.importingTemplate = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [exportTemplate.pending.type]: (state, action: PayloadAction<ITemplate>) => {
            state.exportingTemplate = API_REQUEST_STATE.START;
        },
        [exportTemplate.fulfilled.type]: (state, action: PayloadAction<ITemplate>) => {
            state.exportingTemplate = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [exportTemplate.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.exportingTemplate = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [addTemplate.pending.type]: (state, action: PayloadAction<ITemplate>) => {
            state.addingTemplate = API_REQUEST_STATE.START;
        },
        [addTemplate.fulfilled.type]: (state, action: PayloadAction<ITemplate>) => {
            state.addingTemplate = API_REQUEST_STATE.FINISH;
            state.templates.push(action.payload);
            state.error = null;
        },
        [addTemplate.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingTemplate = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateTemplate.pending.type]: (state) => {
            state.updatingTemplate = API_REQUEST_STATE.START;
        },
        [updateTemplate.fulfilled.type]: (state, action: PayloadAction<ITemplate>) => {
            state.updatingTemplate = API_REQUEST_STATE.FINISH;
            state.templates = state.templates.map(template => template.templateId === action.payload.templateId ? action.payload : template);
            if(state.currentTemplate && state.currentTemplate.templateId === action.payload.templateId){
                state.currentTemplate = action.payload;
            }
            state.error = null;
        },
        [updateTemplate.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingTemplate = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateTemplates.pending.type]: (state) => {
            state.updatingTemplates = API_REQUEST_STATE.START;
        },
        [updateTemplates.fulfilled.type]: (state, action: PayloadAction<ITemplate[]>) => {
            state.updatingTemplates = API_REQUEST_STATE.FINISH;
            if(state.templates.length > 0){
                state.templates = state.templates.map(template => {
                    let index = action.payload.findIndex(t => t.templateId === template.templateId);
                    if(index !== -1){
                        return action.payload[index];
                    } else{
                        return template;
                    }
                });
                if(state.currentTemplate){
                    let index = action.payload.findIndex(t => t.templateId === state.currentTemplate.templateId);
                    if(index !== -1){
                        state.currentTemplate = action.payload[index];
                    }
                }
            }
            state.error = null;
        },
        [updateTemplates.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingTemplates = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getTemplateById.pending.type]: (state) => {
            state.gettingTemplate = API_REQUEST_STATE.START;
        },
        [getTemplateById.fulfilled.type]: (state, action: PayloadAction<ITemplate>) => {
            state.gettingTemplate = API_REQUEST_STATE.FINISH;
            state.currentTemplate = action.payload;
            state.error = null;
        },
        [getTemplateById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingTemplate = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getTemplateByConnectionId.pending.type]: (state) => {
            state.gettingTemplateByConnectionId = API_REQUEST_STATE.START;
        },
        [getTemplateByConnectionId.fulfilled.type]: (state, action: PayloadAction<ITemplate>) => {
            state.gettingTemplateByConnectionId = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [getTemplateByConnectionId.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingTemplateByConnectionId = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllTemplates.pending.type]: (state) => {
            state.gettingTemplates = API_REQUEST_STATE.START;
        },
        [getAllTemplates.fulfilled.type]: (state, action: PayloadAction<ITemplate[]>) => {
            state.gettingTemplates = API_REQUEST_STATE.FINISH;
            state.templates = action.payload;
            state.error = null;
        },
        [getAllTemplates.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingTemplates = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getTemplatesByConnectors.pending.type]: (state) => {
            state.gettingTemplates = API_REQUEST_STATE.START;
        },
        [getTemplatesByConnectors.fulfilled.type]: (state, action: PayloadAction<ITemplate[]>) => {
            state.gettingTemplates = API_REQUEST_STATE.FINISH;
            state.templates = action.payload;
            state.error = null;
        },
        [getTemplatesByConnectors.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingTemplates = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteTemplateById.pending.type]: (state) => {
            state.deletingTemplateById = API_REQUEST_STATE.START;
        },
        [deleteTemplateById.fulfilled.type]: (state, action: PayloadAction<string>) => {
            state.deletingTemplateById = API_REQUEST_STATE.FINISH;
            state.templates = state.templates.filter(template => template.templateId !== action.payload);
            if(state.currentTemplate && state.currentTemplate.templateId === action.payload){
                state.currentTemplate = null;
            }
            state.error = null;
        },
        [deleteTemplateById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingTemplateById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteTemplatesById.pending.type]: (state) => {
            state.deletingTemplatesById = API_REQUEST_STATE.START;
        },
        [deleteTemplatesById.fulfilled.type]: (state, action: PayloadAction<string[]>) => {
            state.deletingTemplatesById = API_REQUEST_STATE.FINISH;
            state.templates = state.templates.filter(template => action.payload.findIndex(id => id === template.templateId) === -1);
            if(state.currentTemplate && action.payload.findIndex(id => id === state.currentTemplate.templateId) !== -1){
                state.currentTemplate = null;
            }
            state.error = null;
        },
        [deleteTemplatesById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingTemplatesById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default templateSlice.reducer;
