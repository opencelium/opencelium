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
import {ICredentials} from "../../interfaces/IAuth";
import {AuthRequest} from "../../requests/classes/Auth";
import {errorHandler, timeout} from "../../utils/utils";
import User from "@entity/user/classes/User";

const HasLicenseCheck = false;
export let AuthUser:any = null;
export const login = createAsyncThunk(
    'login',
    async(data: ICredentials, thunkAPI) => {
        try {
            const request = new AuthRequest({hasAuthToken: false, isApi: false});
            const loginResponseData = await request.login(data);
            const authUser = User.getUserFromLoginResponse(loginResponseData);
            if (HasLicenseCheck && !loginResponseData.data.hasLicense) {
                //todo: remove authUser when backend will be ready
                AuthUser = authUser;
                return thunkAPI.rejectWithValue(errorHandler({message: 'NO_LICENSE'}));
            }
            if(!authUser){
                return thunkAPI.rejectWithValue(errorHandler({message: 'Your token is not valid'}));
            }
            return {...authUser, hasLicense: true};
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const uploadToken = createAsyncThunk(
    'upload-token',
    async(data: {token: string}, thunkAPI) => {
        try {
            await timeout();
            if(data.token !== '1') {
                return thunkAPI.rejectWithValue(errorHandler({message: 'WRONG_LICENSE_TOKEN'}));
            }
            //todo: uncomment when backend will be ready
            //const request = new AuthRequest({hasAuthToken: false, isApi: false});
            //const loginResponseData = await request.uploadToken(data.token);
            //const authUser = User.getUserFromLoginResponse(loginResponseData);
            //if(!authUser){
           //     return thunkAPI.rejectWithValue(errorHandler({message: 'Your token is not valid'}));
            //}
            //return authUser;
            return AuthUser;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    login,
    uploadToken,
}
