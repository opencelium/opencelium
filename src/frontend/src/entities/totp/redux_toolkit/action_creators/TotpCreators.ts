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
import TotpRequest from "@entity/totp/requests/classes/Totp";
import {LoginTOTPRequest, ToggleTotpRequest, ValidateTOTPRequest} from "@entity/totp/requests/interfaces/ITotp";
import User from "@entity/user/classes/User";

export const enableTotp = createAsyncThunk(
    'totp/enable',
    async(userId: number, thunkAPI) => {
        try {
            const request = new TotpRequest({endpoint: `/${userId}/totp/enable`})
            await request.toggleTotp();
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const disableTotp = createAsyncThunk(
    'totp/disable',
    async(userId: number, thunkAPI) => {
        try {
            const request = new TotpRequest({endpoint: `/${userId}/totp/disable`})
            await request.toggleTotp();
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const enableUsersTotp = createAsyncThunk(
    'totp/users/enable',
    async(userIds: number[], thunkAPI) => {
        try {
            const request = new TotpRequest()
            await request.enableUsersTotp(userIds);
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const loginTotp = createAsyncThunk(
    'totp/login',
    async(data: LoginTOTPRequest, thunkAPI) => {
        try {
            const request = new TotpRequest({endpoint: `/totp/disable`})
            const response = await request.login(data);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const validateTotp = createAsyncThunk(
    'totp/validate',
    async(data: ValidateTOTPRequest, thunkAPI) => {
        try {
            const request = new TotpRequest()
            const response = await request.validate(data);
            const authUser = User.getUserFromLoginResponse(response);
            if(!authUser){
                return thunkAPI.rejectWithValue(errorHandler({message: 'Your token is not valid'}));
            }
            return {...authUser};
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export default {
    enableTotp,
    disableTotp,
    enableUsersTotp,
    loginTotp,
    validateTotp,
}
