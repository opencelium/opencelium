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
import {errorHandler} from "../../utils/utils";
import User from "@entity/user/classes/User";


export const login = createAsyncThunk(
    'login',
    async(data: ICredentials, thunkAPI) => {
        try {
            const request = new AuthRequest({hasAuthToken: false, isApi: false});
            const loginResponseData = await request.login(data);
            const authUser = User.getUserFromLoginResponse(loginResponseData);
            if(!authUser){
                return thunkAPI.rejectWithValue(errorHandler({message: 'Your token is not valid'}));
            }
            return authUser;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    login,
}