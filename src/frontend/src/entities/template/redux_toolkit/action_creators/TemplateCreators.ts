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

import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import {TemplateRequest} from "@entity/connection/requests/classes/Template";
import { ITemplate } from "@entity/connection/interfaces/ITemplate";
import ModelTemplate from "@entity/connection/requests/models/Template";


export const checkTemplateName = createAsyncThunk(
    'template/exist/name',
    async(template: ITemplate, thunkAPI) => {
        try {
            const request = new TemplateRequest({endpoint: `/check/${template.name}`});
            const response = await request.checkTemplateName();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const importTemplate = createAsyncThunk(
    'template/import',
    async(templateFile: Blob, thunkAPI) => {
        try {
            let data = new FormData();
            data.append('file', templateFile);
            const importRequest = new TemplateRequest({isFormData: true});
            const importResponse = await importRequest.importTemplate(data);
            const getRequest = new TemplateRequest({endpoint: `/${importResponse.data.id}`});
            const getResponse = await getRequest.getTemplateById();
            return getResponse.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const exportTemplate = createAsyncThunk(
    'template/export/byId',
    async(template: ITemplate, thunkAPI) => {
        try {
            const request = new TemplateRequest({url: template.link, isFullUrl: true, hasAuthToken: true,});
            const response = await request.exportTemplate();
            return {...template, templateContent: response.data};
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addTemplate = createAsyncThunk(
    'template/add',
    async(template: ITemplate, thunkAPI) => {
        try {
            const request = new TemplateRequest();
            const response = await request.addTemplate(template);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateTemplate = createAsyncThunk(
    'template/update',
    async(template: ModelTemplate, thunkAPI) => {
        try {
            const request = new TemplateRequest({endpoint: `/${template.templateId}`});
            const response = await request.updateTemplate(template);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateTemplates = createAsyncThunk(
    'template/selected/update',
    async(templates: ITemplate[], thunkAPI) => {
        try {
            const request = new TemplateRequest();
            const response = await request.updateTemplates(templates);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getTemplateById = createAsyncThunk(
    'template/get/byId',
    async(templateId: number, thunkAPI) => {
        try {
            const request = new TemplateRequest({endpoint: `/${templateId}`});
            const response = await request.getTemplateById();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getTemplateByConnectionId = createAsyncThunk(
    'template/get/byConnectionId',
    async(templateId: number, thunkAPI) => {
        try {
            const request = new TemplateRequest({endpoint: `/connection/${templateId}`});
            const response = await request.getTemplateByConnectionId();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getTemplatesByConnectors = createAsyncThunk(
    'template/get/byConnectors',
    async({from, to}: {from: number, to: number} , thunkAPI) => {
        try {
            const request = new TemplateRequest({endpoint: `/all/${from}/${to}`});
            const response = await request.getAllTemplates();
            // @ts-ignore
            return response.data || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllTemplates = createAsyncThunk(
    'template/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new TemplateRequest({endpoint: `/all`});
            const response = await request.getAllTemplates();
            // @ts-ignore
            return response.data || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteTemplateById = createAsyncThunk(
    'template/delete/byId',
    async(id: string, thunkAPI) => {
        try {
            const request = new TemplateRequest({endpoint: `/${id}`});
            await request.deleteTemplateById();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteTemplatesById = createAsyncThunk(
    'template/delete/selected/byId',
    async(identifiers: number[], thunkAPI) => {
        try {
            const request = new TemplateRequest();
            await request.deleteTemplatesById({identifiers});
            return identifiers;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    importTemplate,
    exportTemplate,
    addTemplate,
    updateTemplate,
    updateTemplates,
    getTemplateById,
    getTemplateByConnectionId,
    getAllTemplates,
    deleteTemplateById,
    deleteTemplatesById,
}
