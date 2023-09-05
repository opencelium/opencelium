import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";
import {DataAggregatorRequest} from "@entity/data_aggregator/requests/classes/DataAggregator";

const dataAggregator = [{
    id: '1',
    name: 'collect_removed',
    script: 'var arg1;\nvar arg2;\n\narg1 + arg2',
    args: [{name: 'arg1', description: 'desc1'},{name: 'arg2', description: 'desc2'}]
},{
    id: '2',
    name: 'collect_updated',
    script: 'var arg1;\nvar arg2;\n\narg1 + arg2',
    args: [{name: 'arg1', description: 'desc1'}, {name: 'arg2', description: 'desc2'}]
},{
    id: '3',
    name: 'Create',
    script: 'var arg1;\nvar arg2;\n\narg1 + arg2',
    args: [{name: 'arg1', description: 'desc1'},{name: 'arg2', description: 'desc2'}]
}, {
    id: '4',
    name: 'Deleted',
    script: 'var arg1;\nvar arg2;\n\narg1 + arg2',
    args: [{name: 'arg1', description: 'desc1'}, {name: 'arg2', description: 'desc2'}]
}];
export const addAggregator = createAsyncThunk(
    'data_aggregator/add',
    async(aggregator: ModelDataAggregator, thunkAPI) => {
        try {
/*            const request = new DataAggregatorRequest();
            const response = await request.addAggregator(aggregator);
            return response.data;*/
            return {...aggregator, id: '5'}
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const updateAggregator = createAsyncThunk(
    'data_aggregator/update',
    async(aggregator: ModelDataAggregator, thunkAPI) => {
        try {
/*            const request = new DataAggregatorRequest({endpoint: `/${aggregator.id}`});
            const response = await request.updateAggregator(aggregator);
            return aggregator;*/
            return aggregator;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getAggregatorById = createAsyncThunk(
    'data_aggregator/get/byId',
    async(aggregatorId: string, thunkAPI) => {
        try {
            /*const request = new DataAggregatorRequest({endpoint: `/${aggregatorId}`});
            const response = await request.getAggregator();
            return response.data;*/
            return dataAggregator.find(a => a.id === aggregatorId);
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllAggregators = createAsyncThunk(
    'data_aggregator/get/all',
    async(data: never, thunkAPI) => {
        try {
            /*const request = new DataAggregatorRequest({endpoint: `/all`});
            const response = await request.getAllAggregators();
            // @ts-ignore
            return response.data || [];*/
            return dataAggregator;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteAggregatorById = createAsyncThunk(
    'data_aggregator/delete/byId',
    async(id: string, thunkAPI) => {
        try {
            /*const request = new DataAggregatorRequest({endpoint: `/${id}`});
            await request.deleteAggregator();
            return id;*/
            dataAggregator.filter(a => a.id !== id)
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
