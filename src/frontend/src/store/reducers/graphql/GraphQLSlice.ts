import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {CommonState} from "../../store";
import {ICommonState} from "@interface/application/core";
import {IResponse} from "@requestInterface/application/IResponse";
import {graphQLLogin} from "@action/graphql/GraphQLCreators";

export interface GraphQLState extends ICommonState{
    authStatus: string,
    accessToken: string,
    refreshToken: string,
    logining: API_REQUEST_STATE,
}
const initialState: GraphQLState = {
    authStatus: '',
    accessToken: '',
    refreshToken: '',
    logining: API_REQUEST_STATE.INITIAL,
    ...CommonState,
}

export const graphQLSlice = createSlice({
    name: 'graphql',
    initialState,
    reducers: {},
    extraReducers: {
        [graphQLLogin.pending.type]: (state, action: PayloadAction<any>) => {
            state.logining = API_REQUEST_STATE.START;
        },
        [graphQLLogin.fulfilled.type]: (state, action: PayloadAction<any>) => {
            state.logining = API_REQUEST_STATE.FINISH;
            state.error = null;
            state.accessToken = action.payload.data.authentication.login.accessToken;
            state.refreshToken = action.payload.data.authentication.login.refreshToken;
            state.authStatus = action.payload.data.authentication.login.status;
        },
        [graphQLLogin.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.logining = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default graphQLSlice.reducer;