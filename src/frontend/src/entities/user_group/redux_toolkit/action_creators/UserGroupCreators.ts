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
import {IEntityWithImage} from "@application/requests/interfaces/IRequest";
import {UserGroupRequest} from "../../requests/classes/UserGroup";
import ModelUserGroup from "../../requests/models/UserGroup";

export const checkUserGroupName = createAsyncThunk(
    'user_group/exist/name',
    async(name: string, thunkAPI) => {
        try {
            const request = new UserGroupRequest({endpoint: `/exists/${name}`});
            const response = await request.checkUserGroupName();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addUserGroup = createAsyncThunk(
    'user_group/add',
    async({entityData, iconFile, shouldDeleteIcon} : IEntityWithImage<ModelUserGroup>, thunkAPI) => {
        try {
            const checkNameRequest = new UserGroupRequest({endpoint: `/exists/${entityData.name}`});
            const responseNameRequest = await checkNameRequest.checkUserGroupName();
            if (responseNameRequest.data.message === ResponseMessages.EXISTS) {
                return thunkAPI.rejectWithValue(errorHandler({message: ResponseMessages.EXISTS}));
            }
            const addUserGroupRequest = new UserGroupRequest();
            const response = await addUserGroupRequest.addUserGroup(entityData);
            if(iconFile){
                let data: FormData = new FormData();
                data.append('userGroupId', entityData.groupId.toString());
                data.append('file', iconFile[0]);
                const uploadIconRequest = new UserGroupRequest({isFormData: true});
                await uploadIconRequest.uploadUserGroupImage(data);
            } else if(shouldDeleteIcon){
                const deleteIconRequest = new UserGroupRequest({endpoint: `/${entityData.groupId}/icon`});
                await deleteIconRequest.deleteUserGroupImage();
            }
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateUserGroup = createAsyncThunk(
    'user_group/update',
    async({entityData, iconFile, shouldDeleteIcon} : IEntityWithImage<ModelUserGroup>, thunkAPI) => {
        try {
            // @ts-ignore
            const userGroupState = thunkAPI.getState().userGroupReducer;
            if(userGroupState.currentUserGroup.name !== entityData.name) {
                const checkNameRequest = new UserGroupRequest({endpoint: `/exists/${entityData.name}`});
                const responseNameRequest = await checkNameRequest.checkUserGroupName();
                if (responseNameRequest.data.message === ResponseMessages.EXISTS) {
                    return thunkAPI.rejectWithValue(errorHandler({message: ResponseMessages.EXISTS}));
                }
            }
            const updateUserGroupRequest = new UserGroupRequest({endpoint: `/${entityData.groupId}`});
            const response = await updateUserGroupRequest.updateUserGroup(entityData);
            if(iconFile){
                let data: FormData = new FormData();
                data.append('userGroupId', entityData.groupId.toString());
                data.append('file', iconFile[0]);
                const uploadIconRequest = new UserGroupRequest({isFormData: true});
                await uploadIconRequest.uploadUserGroupImage(data);
            } else if(shouldDeleteIcon){
                const deleteIconRequest = new UserGroupRequest({endpoint: `/${entityData.groupId}/icon`});
                await deleteIconRequest.deleteUserGroupImage();
            }
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getUserGroupById = createAsyncThunk(
    'user_group/get/byId',
    async(userGroupId: number, thunkAPI) => {
        try {
            const request = new UserGroupRequest({endpoint: `/${userGroupId}`});
            const response = await request.getUserGroupById();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllUserGroups = createAsyncThunk(
    'user_group/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new UserGroupRequest({endpoint: `/all`});
            const response = await request.getAllUserGroups();
            return response.data || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteUserGroupById = createAsyncThunk(
    'user_group/delete/byId',
    async(id: number, thunkAPI) => {
        try {
            const request = new UserGroupRequest({endpoint: `/${id}`});
            await request.deleteUserGroupById();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteUserGroupsById = createAsyncThunk(
    'user_group/delete/selected/byId',
    async(userGroupIds: number[], thunkAPI) => {
        try {
            const request = new UserGroupRequest();
            await request.deleteUserGroupsById(userGroupIds);
            return userGroupIds;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const uploadUserGroupImage = createAsyncThunk(
    'user_group/upload/image',
    async(userGroup: ModelUserGroup, thunkAPI) => {
        try{
            let data: FormData = new FormData();
            data.append('userGroupId', userGroup.groupId.toString());
            data.append('file', userGroup.icon[0]);
            const request = new UserGroupRequest({isFormData: true});
            await request.uploadUserGroupImage(data);
            return userGroup;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteUserGroupImage = createAsyncThunk(
    'user_group/delete/image',
    async(userGroup: ModelUserGroup, thunkAPI) => {
        try {
            const request = new UserGroupRequest({endpoint: `/${userGroup.groupId}/icon`});
            await request.deleteUserGroupImage();
            return userGroup;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    checkUserGroupName,
    addUserGroup,
    updateUserGroup,
    getUserGroupById,
    getAllUserGroups,
    deleteUserGroupById,
    deleteUserGroupsById,
    uploadUserGroupImage,
    deleteUserGroupImage,
}