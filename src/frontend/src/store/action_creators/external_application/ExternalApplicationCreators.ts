import {createAsyncThunk} from "@reduxjs/toolkit";
import {ExternalApplicationRequest} from "@request/external_application/ExternalApplication";
import {errorHandler} from "../../../components/utils";

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