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
import {UserGroupRequest} from "@request/user_group/UserGroup";
import { IUserGroup } from "@interface/usergroup/IUserGroup";
import {errorHandler} from "../../components/utils";
import {ResponseMessages} from "@requestInterface/application/IResponse";

export const checkUserGroupName = createAsyncThunk(
    'user_group/exist/name',
    async(userGroup: IUserGroup, thunkAPI) => {
        try {
            const request = new UserGroupRequest({endpoint: `/exists/${userGroup.name}`});
            const response = await request.checkUserGroupName();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addUserGroup = createAsyncThunk(
    'user_group/add',
    async(userGroup: IUserGroup, thunkAPI) => {
        try {
            const checkNameRequest = new UserGroupRequest({endpoint: `/exists/${userGroup.name}`});
            const responseNameRequest = await checkNameRequest.checkUserGroupName();
            if (responseNameRequest.data.message === ResponseMessages.EXISTS) {
                return thunkAPI.rejectWithValue(responseNameRequest.data);
            }
            const addUserGroupRequest = new UserGroupRequest();
            const response = await addUserGroupRequest.addUserGroup(userGroup);
            if(userGroup.iconFile){
                let data: FormData = new FormData();
                data.append('userGroupId', userGroup.id.toString());
                data.append('file', userGroup.icon[0]);
                const uploadIconRequest = new UserGroupRequest({isFormData: true});
                await uploadIconRequest.uploadUserGroupImage(data);
            } else if(userGroup.shouldDeleteIcon){
                const deleteIconRequest = new UserGroupRequest({endpoint: `/${userGroup.id}/icon`});
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
    async(userGroup: IUserGroup, thunkAPI) => {
        try {
            // @ts-ignore
            const userGroupState = thunkAPI.getState().userGroupReducer;
            if(userGroupState.currentUserGroup.name !== userGroup.name) {
                const checkNameRequest = new UserGroupRequest({endpoint: `/exists/${userGroup.name}`});
                const responseNameRequest = await checkNameRequest.checkUserGroupName();
                if (responseNameRequest.data.message === ResponseMessages.EXISTS) {
                    return thunkAPI.rejectWithValue(responseNameRequest.data);
                }
            }
            const updateUserGroupRequest = new UserGroupRequest({endpoint: `/${userGroup.id}`});
            const response = await updateUserGroupRequest.updateUserGroup(userGroup);
            if(userGroup.iconFile){
                let data: FormData = new FormData();
                data.append('userGroupId', userGroup.id.toString());
                data.append('file', userGroup.icon[0]);
                const uploadIconRequest = new UserGroupRequest({isFormData: true});
                await uploadIconRequest.uploadUserGroupImage(data);
            } else if(userGroup.shouldDeleteIcon){
                const deleteIconRequest = new UserGroupRequest({endpoint: `/${userGroup.id}/icon`});
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
            // @ts-ignore
            return response.data._embedded?.userRoleResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteUserGroupById = createAsyncThunk(
    'user_group/delete/byId',
    async(userGroup: IUserGroup, thunkAPI) => {
        try {
            const request = new UserGroupRequest({endpoint: `/${userGroup.id}`});
            await request.deleteUserGroupById();
            return userGroup;
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
    async(userGroup: IUserGroup, thunkAPI) => {
        try{
            let data: FormData = new FormData();
            data.append('userGroupId', userGroup.id.toString());
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
    async(userGroup: IUserGroup, thunkAPI) => {
        try {
            const request = new UserGroupRequest({endpoint: `/${userGroup.id}/icon`});
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