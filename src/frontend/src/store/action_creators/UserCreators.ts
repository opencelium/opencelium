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
import {UserRequest} from "@request/user/User";
import { IUser } from "@interface/user/IUser";
import {ResponseMessages} from "@requestInterface/application/IResponse";
import {errorHandler} from "../../components/utils";
import {IEntityWithImage} from "@requestInterface/application/IRequest";
import ModelConnectorPoust from "@model/connector/ConnectorPoust";
import ModelUserPoust from "@model/user/UserPoust";

export const checkUserEmail = createAsyncThunk(
    'user/exist/email',
    async(email: string, thunkAPI) => {
        try {
            const request = new UserRequest({endpoint: `/check/${email}`});
            const response = await request.checkUserEmail();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addUser = createAsyncThunk(
    'user/add',
    async({entityData, iconFile, shouldDeleteIcon} : IEntityWithImage<ModelUserPoust>, thunkAPI) => {
        try {
            const checkEmailRequest = new UserRequest({endpoint: `/check/${entityData.email}`});
            const responseEmailRequest = await checkEmailRequest.checkUserEmail();
            if (responseEmailRequest.data.message === ResponseMessages.EXISTS) {
                return thunkAPI.rejectWithValue(errorHandler({message: ResponseMessages.EXISTS}));
            }
            const addUserRequest = new UserRequest();
            const response = await addUserRequest.addUser(entityData);
            if (iconFile) {
                let data: FormData = new FormData();
                data.append('email', entityData.email);
                data.append('file', iconFile[0]);
                const uploadImageRequest = new UserRequest({isFormData: true});
                await uploadImageRequest.uploadUserImage(data);
            } else if (shouldDeleteIcon) {
                const deleteImageRequest = new UserRequest({endpoint: `/${entityData.userId}/profilePicture`});
                await deleteImageRequest.deleteUserImage();
            }
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateUser = createAsyncThunk(
    'user/update',
    async({entityData, iconFile, shouldDeleteIcon} : IEntityWithImage<ModelUserPoust>, thunkAPI) => {
        try {
            // @ts-ignore
            const userState = thunkAPI.getState().userReducer;
            if(userState.currentUser.email !== entityData.email ){
                const checkEmailRequest = new UserRequest({endpoint: `/check/${entityData.email}`});
                const responseEmailRequest = await checkEmailRequest.checkUserEmail();
                if (responseEmailRequest.data.message === ResponseMessages.EXISTS) {
                    return thunkAPI.rejectWithValue(errorHandler({message: ResponseMessages.EXISTS}));
                }
            }
            const request = new UserRequest({endpoint: `/${entityData.userId}`});
            const response = await request.updateUser(entityData);
            if (iconFile) {
                let data: FormData = new FormData();
                data.append('email', entityData.email);
                data.append('file', iconFile[0]);
                const request = new UserRequest({isFormData: true});
                await request.uploadUserImage(data);
            } else if (shouldDeleteIcon) {
                const deleteImageRequest = new UserRequest({endpoint: `/${entityData.userId}/profilePicture`});
                await deleteImageRequest.deleteUserImage();
            }
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getUserById = createAsyncThunk(
    'user/get/byId',
    async(userId: number, thunkAPI) => {
        try {
            const request = new UserRequest({endpoint: `/${userId}`});
            const response = await request.getUserById();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllUsers = createAsyncThunk(
    'user/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new UserRequest({endpoint: `/all`});
            const response = await request.getAllUsers();
            return response.data._embedded?.userResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteUserById = createAsyncThunk(
    'user/delete/byId',
    async(id: number, thunkAPI) => {
        try {
            const request = new UserRequest({endpoint: `/${id}`});
            await request.deleteUserById();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteUsersById = createAsyncThunk(
    'user/delete/selected/byId',
    async(userIds: number[], thunkAPI) => {
        try {
            const request = new UserRequest();
            await request.deleteUsersById(userIds);
            return userIds;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const uploadUserImage = createAsyncThunk(
    'user/upload/image',
    async(data: any, thunkAPI) => {
        try{
            let formData: FormData = new FormData();
            formData.append('email', data.email);
            formData.append('file', data.image[0]);
            const request = new UserRequest({isFormData: true});
            const response = await request.uploadUserImage(formData);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteUserImage = createAsyncThunk(
    'user/delete/image/byId',
    async(id: string, thunkAPI) => {
        try{
            const request = new UserRequest({endpoint: `/${id}/profilePicture`});
            await request.deleteUserImage();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    checkUserEmail,
    addUser,
    updateUser,
    getUserById,
    getAllUsers,
    deleteUserById,
    deleteUsersById,
    uploadUserImage,
    deleteUserImage,
}