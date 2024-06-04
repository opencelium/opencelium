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

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {CommonState} from "@application/utils/store";
import {ICommonState} from "@application/interfaces/core";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {
    checkAllExternalApplications,
    checkElasticsearch,
    checkMongoDB
} from "../action_creators/ExternalApplicationCreators";
import {
    ActuatorHealthResponseProps,
    ElasticSearchResponseProps, MongoDBResponseProps,
} from "../../requests/interfaces/IExternalApplication";

export interface ExternalApplicationSlice extends ICommonState{
    checkingElasticSearch: API_REQUEST_STATE,
    checkingMongoDB: API_REQUEST_STATE,
    checkingAll: API_REQUEST_STATE,
    elasticSearchCheckResults: ElasticSearchResponseProps,
    mongoDBCheckResults: MongoDBResponseProps,
    actuatorHealth: ActuatorHealthResponseProps,
}

const initialState: ExternalApplicationSlice = {
    checkingElasticSearch: API_REQUEST_STATE.INITIAL,
    checkingMongoDB: API_REQUEST_STATE.INITIAL,
    checkingAll: API_REQUEST_STATE.INITIAL,
    elasticSearchCheckResults: null,
    mongoDBCheckResults: null,
    actuatorHealth: null,
    ...CommonState,
}

export const externalApplicationSlice = createSlice({
    name: 'external_application',
    initialState,
    reducers: {
    },
    extraReducers: {
        [checkElasticsearch.pending.type]: (state) => {
            state.checkingElasticSearch = API_REQUEST_STATE.START;
        },
        [checkElasticsearch.fulfilled.type]: (state, action: PayloadAction<ElasticSearchResponseProps>) => {
            state.checkingElasticSearch = API_REQUEST_STATE.FINISH;
            state.elasticSearchCheckResults = action.payload;
            state.error = null;
        },
        [checkElasticsearch.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingElasticSearch = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [checkMongoDB.pending.type]: (state) => {
            state.checkingMongoDB = API_REQUEST_STATE.START;
        },
        [checkMongoDB.fulfilled.type]: (state, action: PayloadAction<{data: MongoDBResponseProps}>) => {
            state.checkingMongoDB = API_REQUEST_STATE.FINISH;
            state.mongoDBCheckResults = action.payload.data;
            state.error = null;
        },
        [checkMongoDB.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingMongoDB = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [checkAllExternalApplications.pending.type]: (state) => {
            state.checkingAll = API_REQUEST_STATE.START;
        },
        [checkAllExternalApplications.fulfilled.type]: (state, action: PayloadAction<ActuatorHealthResponseProps>) => {
            state.checkingAll = API_REQUEST_STATE.FINISH;
            state.actuatorHealth = action.payload;
            state.error = null;
        },
        [checkAllExternalApplications.rejected.type]: (state, action: PayloadAction<ActuatorHealthResponseProps>) => {
            state.checkingAll = API_REQUEST_STATE.ERROR;
            state.actuatorHealth = action.payload;
            state.error = action.payload;
        },
    }
})

export default externalApplicationSlice.reducer;
