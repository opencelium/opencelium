/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {checkAllExternalApplications, checkElasticsearch, checkNeo4j} from "../action_creators/ExternalApplicationCreators";
import {
    ActuatorHealthResponseProps,
    ElasticSearchResponseProps,
    Neo4jResponseProps
} from "../../requests/interfaces/IExternalApplication";

export interface ExternalApplicationSlice extends ICommonState{
    checkingNeo4j: API_REQUEST_STATE,
    checkingElasticSearch: API_REQUEST_STATE,
    checkingAll: API_REQUEST_STATE,
    neo4jCheckResults: Neo4jResponseProps,
    elasticSearchCheckResults: ElasticSearchResponseProps,
    actuatorHealth: ActuatorHealthResponseProps,
}

const initialState: ExternalApplicationSlice = {
    checkingNeo4j: API_REQUEST_STATE.INITIAL,
    checkingElasticSearch: API_REQUEST_STATE.INITIAL,
    checkingAll: API_REQUEST_STATE.INITIAL,
    neo4jCheckResults: null,
    elasticSearchCheckResults: null,
    actuatorHealth: null,
    ...CommonState,
}

export const externalApplicationSlice = createSlice({
    name: 'external_application',
    initialState,
    reducers: {
    },
    extraReducers: {
        [checkNeo4j.pending.type]: (state) => {
            state.checkingNeo4j = API_REQUEST_STATE.START;
        },
        [checkNeo4j.fulfilled.type]: (state, action: PayloadAction<Neo4jResponseProps>) => {
            state.checkingNeo4j = API_REQUEST_STATE.FINISH;
            state.neo4jCheckResults = action.payload;
            state.error = null;
        },
        [checkNeo4j.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingNeo4j = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
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
        [checkAllExternalApplications.pending.type]: (state) => {
            state.checkingAll = API_REQUEST_STATE.START;
        },
        [checkAllExternalApplications.fulfilled.type]: (state, action: PayloadAction<ActuatorHealthResponseProps>) => {
            state.checkingAll = API_REQUEST_STATE.FINISH;
            state.actuatorHealth = action.payload;
            state.error = null;
        },
        [checkAllExternalApplications.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingAll = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default externalApplicationSlice.reducer;