import jwt from 'jsonwebtoken';
import {createAsyncThunk} from "@reduxjs/toolkit";
import {ICredentials, TokenProps} from "@interface/application/IAuth";
import {AuthRequest} from "@request/application/Auth";
import {IAuthUser} from "@interface/user/IAuthUser";
import {errorHandler} from "../../../components/utils";


export const updateAuthUserDetail = createAsyncThunk(
    'auth_user/update/user_detail',
    async(user: IAuthUser, thunkAPI) => {
        try {
            const request = new AuthRequest({endpoint: `userDetail/${user.id}`});
            await request.updateAuthUserDetail(user.userDetail);
            return user;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const login = createAsyncThunk(
    'login',
    async(data: ICredentials, thunkAPI) => {
        try {
            const request = new AuthRequest({hasAuthToken: false, isApi: false});
            const {data: {userDetail, userGroup}, headers} = await request.login(data);
            const token = headers?.authorization || '';
            if(token !== '') {
                // @ts-ignore
                const decodedData: TokenProps = jwt.decode(token.slice(7));
                const authUser: IAuthUser = {
                    id: decodedData.userId,
                    email: decodedData.sub,
                    token,
                    expTime: decodedData.exp * 1000,
                    sessionTime: parseInt(decodedData.sessionTime),
                    lastLogin: decodedData.iat * 1000,
                    userGroup: userGroup,
                    userDetail: userDetail,
                };
                return authUser;
            } else{
                return thunkAPI.rejectWithValue('Your token is not valid');
            }
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    updateAuthUserDetail,
    login,
}