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
    script: 'var arg3;\nvar arg4;\n\narg3 + arg4',
    args: [{name: 'arg3', description: 'desc3'}, {name: 'arg4', description: 'desc4'}]
},{
    id: '3',
    name: 'Create',
    script: 'var arg5;\nvar arg6;\n\narg5 + arg6',
    args: [{name: 'arg5', description: 'desc5'},{name: 'arg6', description: 'desc6'}]
}, {
    id: '4',
    name: 'Deleted',
    script: 'var arg7;\nvar arg8;\n\narg7 + arg8',
    args: [{name: 'arg7', description: 'desc7'}, {name: 'arg8', description: 'desc8'}]
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
