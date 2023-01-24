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
import {ExternalApplicationRequest} from "../../requests/classes/ExternalApplication";

export const checkNeo4j = createAsyncThunk(
    'external_application/check/neo4j',
    async(data: never, thunkAPI) => {
        try {
            const request = new ExternalApplicationRequest({isApi: false});
            const response = await request.checkNeo4j();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const checkElasticsearch = createAsyncThunk(
    'external_application/check/elasticsearch',
    async(data: never, thunkAPI) => {
        try {
            const request = new ExternalApplicationRequest({isApi: false});
            const response = await request.checkElasticsearch();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const checkAllExternalApplications = createAsyncThunk(
    'external_application/check/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new ExternalApplicationRequest({isApi: false});
            const response = await request.checkAll();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    checkNeo4j,
    checkElasticsearch,
    checkAllExternalApplications,
}