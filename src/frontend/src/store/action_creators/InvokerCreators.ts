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
import {InvokerRequest} from "@request/invoker/Invoker";
import { IInvoker } from "@interface/invoker/IInvoker";
import {errorHandler} from "../../components/utils";
import {UpdateMethodProps} from "@requestInterface/invoker/IInvoker";
import {ResponseMessages} from "@requestInterface/application/IResponse";


export const importInvoker = createAsyncThunk(
    'invoker/import',
    async(invokerFile: Blob, thunkAPI) => {
        try {
            let data = new FormData();
            data.append('file', invokerFile);
            const request = new InvokerRequest({isFormData: true});
            const response = await request.importInvoker(data);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateOperation = createAsyncThunk(
    'invoker/update/operation',
    async(data: {invokerName: string, methodData: UpdateMethodProps}, thunkAPI) => {
        try {
            const request = new InvokerRequest({endpoint: `/${data.invokerName}/xml`});
            const response = await request.updateOperation(data.methodData);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const checkInvokerName = createAsyncThunk(
    'invoker/exist/name',
    async(invoker: IInvoker, thunkAPI) => {
        try {
            const request = new InvokerRequest({endpoint: `/exists/${invoker.name}`});
            const response = await request.checkInvokerTitle();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addInvoker = createAsyncThunk(
    'invoker/add',
    async(invoker: IInvoker, thunkAPI) => {
        try {
            /*const checkNameRequest = new InvokerRequest({endpoint: `/check/${invoker.name}`});
            const responseNameRequest = await checkNameRequest.checkInvokerTitle();
            if (responseNameRequest.data.message === ResponseMessages.EXISTS) {
                return thunkAPI.rejectWithValue(responseNameRequest.data);
            }*/
            const request = new InvokerRequest();
            const response = await request.addInvoker(invoker);
            if (invoker.icon) {
                let data: FormData = new FormData();
                data.append('name', invoker.name);
                data.append('file', invoker.iconFile[0]);
                const uploadImageRequest = new InvokerRequest({isFormData: true});
                await uploadImageRequest.uploadInvokerImage(data);
            } else if (invoker.shouldDeletePicture) {
                const deleteImageRequest = new InvokerRequest({endpoint: `/${invoker.name}/profilePicture`});
                await deleteImageRequest.deleteInvokerImage();
            }
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateInvoker = createAsyncThunk(
    'invoker/update',
    async(invoker: IInvoker, thunkAPI) => {
        try {
            // @ts-ignore
            const invokerState = thunkAPI.getState().invokerReducer;
            if(invokerState.currentInvoker.name !== invoker.name ){
                const checkNameRequest = new InvokerRequest({endpoint: `/check/${invoker.name}`});
                const responseNameRequest = await checkNameRequest.checkInvokerTitle();
                if (responseNameRequest.data.message === ResponseMessages.EXISTS) {
                    return thunkAPI.rejectWithValue(responseNameRequest.data);
                }
            }
            const request = new InvokerRequest();
            const response = await request.addInvoker(invoker);
            if (invoker.icon) {
                let data: FormData = new FormData();
                data.append('name', invoker.name);
                data.append('file', invoker.iconFile[0]);
                const uploadImageRequest = new InvokerRequest({isFormData: true});
                await uploadImageRequest.uploadInvokerImage(data);
            } else if (invoker.shouldDeletePicture) {
                const deleteImageRequest = new InvokerRequest({endpoint: `/${invoker.name}/profilePicture`});
                await deleteImageRequest.deleteInvokerImage();
            }
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getInvokerByName = createAsyncThunk(
    'invoker/get/byName',
    async(invokerName: string, thunkAPI) => {
        try {
            const request = new InvokerRequest({endpoint: `/${invokerName}`});
            const response = await request.getInvokerByName();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllInvokers = createAsyncThunk(
    'invoker/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new InvokerRequest({endpoint: `/all`});
            const response = await request.getAllInvokers();
            // @ts-ignore
            return response.data._embedded?.invokerResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteInvokerByName = createAsyncThunk(
    'invoker/delete/byName',
    async(invoker: IInvoker, thunkAPI) => {
        try {
            const request = new InvokerRequest({endpoint: `/${invoker.name}`});
            await request.deleteInvokerByName();
            return invoker;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteInvokersById = createAsyncThunk(
    'invoker/delete/selected/byId',
    async(invokerIds: number[], thunkAPI) => {
        try {
            const request = new InvokerRequest();
            await request.deleteInvokersById(invokerIds);
            return invokerIds;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const uploadInvokerImage = createAsyncThunk(
    'invoker/upload/image',
    async(data: {id: number, image: any}, thunkAPI) => {
        try{
            let formData: FormData = new FormData();
            formData.append('invokerId', data.id.toString());
            formData.append('file', data.image[0]);
            const request = new InvokerRequest({isFormData: true});
            const response = await request.uploadInvokerImage(formData);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteInvokerImage = createAsyncThunk(
    'invoker/delete/image',
    async(invoker: IInvoker, thunkAPI) => {
        try {
            const request = new InvokerRequest({endpoint: `/${invoker.id}/icon`});
            await request.deleteInvokerImage();
            return invoker;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    checkInvokerName,
    addInvoker,
    updateInvoker,
    getInvokerByName,
    getAllInvokers,
    deleteInvokerByName,
    deleteInvokersById,
    uploadInvokerImage,
    deleteInvokerImage,
}