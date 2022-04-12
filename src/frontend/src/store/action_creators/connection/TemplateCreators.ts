/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {createAsyncThunk} from "@reduxjs/toolkit";
import {TemplateRequest} from "@request/connection/Template";
import { ITemplate } from "@interface/connection/ITemplate";
import {errorHandler} from "../../../components/utils";
import ModelTemplate from "@model/connection/Template";


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
            const request = new TemplateRequest({isFormData: true});
            const response = await request.importTemplate(data);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const exportTemplate = createAsyncThunk(
    'template/export/byId',
    async(template: ITemplate, thunkAPI) => {
        try {
            const request = new TemplateRequest({url: template.link, isFullUrl: true});
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

export const getTemplatesByConnectors = createAsyncThunk(
    'template/get/byConnectors',
    async({from, to}: {from: number, to: number} , thunkAPI) => {
        try {
            const request = new TemplateRequest({endpoint: `/all/${from}/${to}`});
            const response = await request.getAllTemplates();
            // @ts-ignore
            return response.data._embedded?.templateResourceList || [];
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
            return response.data._embedded?.templateResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteTemplateById = createAsyncThunk(
    'template/delete/byId',
    async(template: ITemplate, thunkAPI) => {
        try {
            const request = new TemplateRequest({endpoint: `/${template.id}`});
            await request.deleteTemplateById();
            return template;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteTemplatesById = createAsyncThunk(
    'template/delete/selected/byId',
    async(templateIds: number[], thunkAPI) => {
        try {
            const request = new TemplateRequest();
            await request.deleteTemplatesById(templateIds);
            return templateIds;
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
    getAllTemplates,
    deleteTemplateById,
    deleteTemplatesById,
}