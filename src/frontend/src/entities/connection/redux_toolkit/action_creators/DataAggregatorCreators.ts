import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import {DataAggregatorRequest} from "@root/requests/classes/DataAggregator";
import {AggregatorRequest} from "@root/requests/interfaces/IDataAggregator";

export const addAggregator = createAsyncThunk(
    'connection/data_aggregator/add',
    async(data: AggregatorRequest, thunkAPI) => {
        try {
            const request = new DataAggregatorRequest({endpoint: `/${data.connectionId}/aggregator`});
            const response = await request.addAggregator(data.aggregator);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const updateAggregator = createAsyncThunk(
    'connection/data_aggregator/update',
    async(data: AggregatorRequest, thunkAPI) => {
        try {
            const request = new DataAggregatorRequest({endpoint: `/${data.connectionId}/aggregator/${data.aggregator.id}`});
            const response = await request.updateAggregator(data.aggregator);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    addAggregator,
    updateAggregator,
}
