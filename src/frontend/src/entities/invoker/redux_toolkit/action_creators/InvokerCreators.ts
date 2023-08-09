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
import {ResponseMessages} from "@application/requests/interfaces/IResponse";
import {InvokerRequest} from "../../requests/classes/Invoker";
import { IInvoker } from "../../interfaces/IInvoker";
import {UpdateMethodProps} from "../../requests/interfaces/IInvoker";


export const importInvoker = createAsyncThunk(
    'invoker/import',
    async(invokerFile: Blob, thunkAPI) => {
        try {
            let data = new FormData();
            data.append('file', invokerFile);
            const importRequest = new InvokerRequest({isFormData: true});
            const importResponse = await importRequest.importInvoker(data);
            const getRequest = new InvokerRequest({endpoint: `/${importResponse.data.id}`});
            const getResponse = await getRequest.getInvokerByName();
            return getResponse.data;
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
    async(name: string, thunkAPI) => {
        try {
            const request = new InvokerRequest({endpoint: `/exists/${name}`});
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
            const checkNameRequest = new InvokerRequest({endpoint: `/exists/${invoker.name}`});
            const responseNameRequest = await checkNameRequest.checkInvokerTitle();
            if (responseNameRequest.data.result === true) {
                return thunkAPI.rejectWithValue({message: ResponseMessages.EXISTS});
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

export const updateInvoker = createAsyncThunk(
    'invoker/update',
    async(invoker: IInvoker, thunkAPI) => {
        try {
            // @ts-ignore
            const invokerState = thunkAPI.getState().invokerReducer;
            if(invokerState.currentInvoker.name !== invoker.name ){
                const checkNameRequest = new InvokerRequest({endpoint: `/exists/${invoker.name}`});
                const responseNameRequest = await checkNameRequest.checkInvokerTitle();
                if (responseNameRequest.data.result === true) {
                    return thunkAPI.rejectWithValue({message: ResponseMessages.EXISTS});
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
            return response.data || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteInvokerByName = createAsyncThunk(
    'invoker/delete/byName',
    async(name: string, thunkAPI) => {
        try {
            const request = new InvokerRequest({endpoint: `/${name}`});
            await request.deleteInvokerByName();
            return name;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteInvokersByName = createAsyncThunk(
    'invoker/delete/selected/byId',
    async(invokerNames: string[], thunkAPI) => {
        try {
            const request = new InvokerRequest();
            await request.deleteInvokersByName({identifiers: invokerNames});
            return invokerNames;
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
    importInvoker,
    updateOperation,
    checkInvokerName,
    addInvoker,
    updateInvoker,
    getInvokerByName,
    getAllInvokers,
    deleteInvokerByName,
    deleteInvokersByName,
    uploadInvokerImage,
    deleteInvokerImage,
}
