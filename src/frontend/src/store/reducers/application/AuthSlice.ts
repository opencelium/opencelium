import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {CommonState} from "../../store";
import {ICommonState} from "@interface/application/core";
import {login, updateAuthUserDetail} from "@action/application/AuthCreators";
import {LocalStorage} from "@class/application/LocalStorage";
import {IAuthUser} from "@interface/user/IAuthUser";
import {IResponse} from "@requestInterface/application/IResponse";

export interface AuthState extends ICommonState{
    authUser: IAuthUser,
    isAuth: boolean,
    expTime: number,
    updatingAuthUser: API_REQUEST_STATE,
    logining: API_REQUEST_STATE,
    logouting: API_REQUEST_STATE,
    isSessionExpired: boolean,
}
const storage = LocalStorage.getStorage(true);
const authUser: IAuthUser = storage.get('authUser');
const initialState: AuthState = {
    authUser: authUser || null,
    isAuth: !!authUser,
    expTime: authUser ? authUser.expTime : 0,
    updatingAuthUser: API_REQUEST_STATE.INITIAL,
    logining: API_REQUEST_STATE.INITIAL,
    logouting: API_REQUEST_STATE.INITIAL,
    isSessionExpired: true,
    ...CommonState,
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.logouting = API_REQUEST_STATE.FINISH;
            state.error = null;
            state.isAuth = false;
            state.authUser = null;
        }
    },
    extraReducers: {
        [updateAuthUserDetail.pending.type]: (state) => {
            state.updatingAuthUser = API_REQUEST_STATE.START;
        },
        [updateAuthUserDetail.fulfilled.type]: (state, action: PayloadAction<IAuthUser>) => {
            state.updatingAuthUser = API_REQUEST_STATE.FINISH;
            if(state.authUser && state.authUser.id === action.payload.id){
                state.authUser = {...action.payload};
            }
            state.error = null;
        },
        [updateAuthUserDetail.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingAuthUser = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [login.pending.type]: (state, action: PayloadAction<any>) => {
            state.logining = API_REQUEST_STATE.START;
        },
        [login.fulfilled.type]: (state, action: PayloadAction<IAuthUser>) => {
            state.logining = API_REQUEST_STATE.FINISH;
            state.error = null;
            state.isAuth = true;
            state.authUser = action.payload;
        },
        [login.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.logining = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const { logout } = authSlice.actions
export default authSlice.reducer;