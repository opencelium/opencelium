import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";
import {DataAggregatorRequest} from "@entity/data_aggregator/requests/classes/DataAggregator";

export const addAggregator = createAsyncThunk(
    'data_aggregator/add',
    async(aggregator: ModelDataAggregator, thunkAPI) => {
        try {
            const checkNameRequest = new DataAggregatorRequest({endpoint: `/unique/${aggregator.name}`});
            const responseNameRequest = await checkNameRequest.checkAggregatorName();
            if(responseNameRequest.data.result === false){
                return thunkAPI.rejectWithValue(responseNameRequest.data);
            }
            const request = new DataAggregatorRequest();
            const response = await request.addAggregator(aggregator);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const updateAggregator = createAsyncThunk(
    'data_aggregator/update',
    async(aggregator: ModelDataAggregator, thunkAPI) => {
        try {
            // @ts-ignore
            const dataAggregatorState = thunkAPI.getState().dataAggregatorReducer;
            if(dataAggregatorState.currentAggregator && dataAggregatorState.currentAggregator.name !== aggregator.name){
                const checkNameRequest = new DataAggregatorRequest({endpoint: `/unique/${aggregator.name}`});
                const responseNameRequest = await checkNameRequest.checkAggregatorName();
                if(responseNameRequest.data.result === false){
                    return thunkAPI.rejectWithValue(responseNameRequest.data);
                }
            }
            const request = new DataAggregatorRequest();
            const response = await request.addAggregator(aggregator);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getAggregatorById = createAsyncThunk(
    'data_aggregator/get/byId',
    async(aggregatorId: string, thunkAPI) => {
        try {
            const request = new DataAggregatorRequest({endpoint: `/${aggregatorId}`});
            const response = await request.getAggregator();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllAggregators = createAsyncThunk(
    'data_aggregator/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new DataAggregatorRequest({endpoint: `/all`});
            const response = await request.getAllAggregators();
            return response.data || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const archiveAggregatorById = createAsyncThunk(
    'data_aggregator/archive/byId',
    async(id: string, thunkAPI) => {
        try {
            const request = new DataAggregatorRequest({endpoint: `/${id}/status`});
            await request.archiveAggregator();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const unarchiveAggregatorById = createAsyncThunk(
    'data_aggregator/unarchive/byId',
    async(id: string, thunkAPI) => {
        try {
            const request = new DataAggregatorRequest({endpoint: `/${id}/status`});
            await request.unarchiveAggregator();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteArgument = createAsyncThunk(
    'data_aggregator/argument/delete/byId',
    async(argumentId: string, thunkAPI) => {
        try {
            const request = new DataAggregatorRequest({endpoint: `/argument/${argumentId}`});
            await request.deleteArgument();
            return argumentId;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)


export default {
    addAggregator,
    updateAggregator,
    getAggregatorById,
    getAllAggregators,
    archiveAggregatorById,
    unarchiveAggregatorById,
    deleteArgument,
}
