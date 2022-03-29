import {createAsyncThunk} from "@reduxjs/toolkit";
import {UserRequest} from "@request/user/User";
import { IUser } from "@interface/user/IUser";
import {ResponseMessages} from "@requestInterface/application/IResponse";
import {errorHandler} from "../../components/utils";

export const checkUserEmail = createAsyncThunk(
    'user/exist/email',
    async(user: IUser, thunkAPI) => {
        try {
            const request = new UserRequest({endpoint: `/check/${user.email}`});
            const response = await request.checkUserEmail();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addUser = createAsyncThunk(
    'user/add',
    async(user: IUser, thunkAPI) => {
        try {
            const checkEmailRequest = new UserRequest({endpoint: `/check/${user.email}`});
            const responseEmailRequest = await checkEmailRequest.checkUserEmail();
            if (responseEmailRequest.data.message === ResponseMessages.EXISTS) {
                return thunkAPI.rejectWithValue(responseEmailRequest.data);
            }
            const addUserRequest = new UserRequest();
            const response = await addUserRequest.addUser(user);
            if (user.userDetail.profilePictureFile) {
                let data: FormData = new FormData();
                data.append('email', user.email);
                data.append('file', user.userDetail.profilePictureFile[0]);
                const uploadImageRequest = new UserRequest({isFormData: true});
                await uploadImageRequest.uploadUserImage(data);
            } else if (user.userDetail.shouldDeletePicture) {
                const deleteImageRequest = new UserRequest({endpoint: `/${user.id}/profilePicture`});
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
    async(user: IUser, thunkAPI) => {
        try {
            // @ts-ignore
            const userState = thunkAPI.getState().userReducer;
            if(userState.currentUser.email !== user.email ){
                const checkEmailRequest = new UserRequest({endpoint: `/check/${user.email}`});
                const responseEmailRequest = await checkEmailRequest.checkUserEmail();
                if (responseEmailRequest.data.message === ResponseMessages.EXISTS) {
                    return thunkAPI.rejectWithValue(responseEmailRequest.data);
                }
            }
            const request = new UserRequest({endpoint: `/${user.id}`});
            const response = await request.updateUser(user);
            if (user.userDetail.profilePictureFile) {
                let data: FormData = new FormData();
                data.append('email', user.email);
                data.append('file', user.userDetail.profilePictureFile[0]);
                const request = new UserRequest({isFormData: true});
                await request.uploadUserImage(data);
            } else if (user.userDetail.shouldDeletePicture) {
                const deleteImageRequest = new UserRequest({endpoint: `/${user.id}/profilePicture`});
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
            // @ts-ignore
            return response.data._embedded?.userResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteUserById = createAsyncThunk(
    'user/delete/byId',
    async(user: IUser, thunkAPI) => {
        try {
            const request = new UserRequest({endpoint: `/${user.id}`});
            await request.deleteUserById();
            return user;
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
    async(user: IUser, thunkAPI) => {
        try{
            const request = new UserRequest({endpoint: `/${user.id}/profilePicture`});
            await request.deleteUserImage();
            return user;
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