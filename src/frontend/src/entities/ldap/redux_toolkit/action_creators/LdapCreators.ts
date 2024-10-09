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
import LdapRequest from "@entity/ldap/requests/classes/Ldap";
import LdapConfigModel from "@entity/ldap/requests/models/LdapConfigModel";

export const getDefaultConfig = createAsyncThunk(
    'ldap/get/default',
    async(data: never, thunkAPI) => {
        try {
            const request = new LdapRequest()
            const response = await request.getDefaultConfig();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const testConfig = createAsyncThunk(
    'ldap/test',
    async(data: LdapConfigModel, thunkAPI) => {
        try {
            const request = new LdapRequest()
            const response = await request.testConfig(data);
            return response.data;
        } catch(e){
            console.log(e);
            return thunkAPI.rejectWithValue(e.response.data);
        }
    }
)
export default {
    getDefaultConfig,
    testConfig,
}
