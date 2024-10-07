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

export const generateQRCode = createAsyncThunk(
    'totp/generate/qr',
    async(data: never, thunkAPI) => {
        try {
            const request = new TotpRequest()
            const response = await request.generateQRCode();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const enableTotp = createAsyncThunk(
    'totp/enable',
    async(data: ToggleTotpRequest, thunkAPI) => {
        try {
            const request = new TotpRequest({endpoint: `/totp/enable`})
            await request.toggleTotp(data);
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const disableTotp = createAsyncThunk(
    'totp/disable',
    async(data: ToggleTotpRequest, thunkAPI) => {
        try {
            const request = new TotpRequest({endpoint: `/totp/disable`})
            await request.toggleTotp(data);
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
export const isTotpExist = createAsyncThunk(
    'totp/exist',
    async(data: never, thunkAPI) => {
        try {
            const request = new TotpRequest()
            const response = await request.isExist();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export default {
    generateQRCode,
    enableTotp,
    disableTotp,
    loginTotp,
    validateTotp,
    isTotpExist,
}
