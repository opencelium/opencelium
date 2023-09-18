import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";
import {DataAggregatorRequest} from "@entity/data_aggregator/requests/classes/DataAggregator";
import {ResponseMessages} from "@application/requests/interfaces/IResponse";

export const addAggregator = createAsyncThunk(
    'data_aggregator/add',
    async(aggregator: ModelDataAggregator, thunkAPI) => {
        try {
            const checkNameRequest = new DataAggregatorRequest({endpoint: `/exists/${aggregator.name}`});
            const responseNameRequest = await checkNameRequest.checkAggregatorName();
            if(responseNameRequest.data.message === ResponseMessages.EXISTS){
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
            if(dataAggregatorState.currentAggregator && dataAggregatorState.currentAggregator.title !== aggregator.name){
                const checkNameRequest = new DataAggregatorRequest({endpoint: `/exists/${aggregator.name}`});
                const responseNameRequest = await checkNameRequest.checkAggregatorName();
                if(responseNameRequest.data.message === ResponseMessages.EXISTS){
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
            // @ts-ignore
            return response.data || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteAggregatorById = createAsyncThunk(
    'data_aggregator/delete/byId',
    async(id: string, thunkAPI) => {
        try {
            const request = new DataAggregatorRequest({endpoint: `/${id}`});
            await request.deleteAggregator();
            return id;
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
    deleteAggregatorById,
}
