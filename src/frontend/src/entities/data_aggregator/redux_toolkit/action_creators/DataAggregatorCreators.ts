import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";
import {DataAggregatorRequest} from "@entity/data_aggregator/requests/classes/DataAggregator";
import {ResponseMessages} from "@application/requests/interfaces/IResponse";
import {ConnectorRequest} from "@entity/connector/requests/classes/Connector";

let dataAggregator: any = [{
    id: '1',
    name: 'collect_removed',
    script: 'var arg1;\nvar arg2;\n\narg1 + arg2',
    args: [{id: 1, name: 'arg1', description: 'desc1'},{id: 2, name: 'arg2', description: 'desc2'}]
},{
    id: '2',
    name: 'collect_updated',
    script: 'var arg3;\nvar arg4;\n\narg3 + arg4',
    args: [{id: 3, name: 'arg3', description: 'desc3'}, {id: 4, name: 'arg4', description: 'desc4'}]
},{
    id: '3',
    name: 'Create',
    script: 'var arg5;\nvar arg6;\n\narg5 + arg6',
    args: [{id: 5, name: 'arg5', description: 'desc5'},{id: 6, name: 'arg6', description: 'desc6'}]
}, {
    id: '4',
    name: 'Deleted',
    script: 'var arg7;\nvar arg8;\n\narg7 + arg8',
    args: [{id: 7, name: 'arg7', description: 'desc7'}, {id: 8, name: 'arg8', description: 'desc8'}]
}];
export const addAggregator = createAsyncThunk(
    'data_aggregator/add',
    async(aggregator: ModelDataAggregator, thunkAPI) => {
        try {
            /*const checkNameRequest = new DataAggregatorRequest({endpoint: `/exists/${aggregator.name}`});
            const responseNameRequest = await checkNameRequest.checkAggregatorName();
            if(responseNameRequest.data.message === ResponseMessages.EXISTS){
                return thunkAPI.rejectWithValue(responseNameRequest.data);
            }
            const request = new DataAggregatorRequest();
            const response = await request.addAggregator(aggregator);
            return response.data;*/
            if(dataAggregator.findIndex((a: any) => a.name === aggregator.name) !== -1){
                return thunkAPI.rejectWithValue({message: ResponseMessages.EXISTS});
            }
            dataAggregator = [...dataAggregator, {...aggregator, id: '5'}];
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
            // @ts-ignore
            /*const dataAggregatorState = thunkAPI.getState().dataAggregatorReducer;
            if(dataAggregatorState.currentAggregator && dataAggregatorState.currentAggregator.title !== aggregator.name){
                const checkNameRequest = new DataAggregatorRequest({endpoint: `/exists/${aggregator.name}`});
                const responseNameRequest = await checkNameRequest.checkAggregatorName();
                if(responseNameRequest.data.message === ResponseMessages.EXISTS){
                    return thunkAPI.rejectWithValue(responseNameRequest.data);
                }
            }
            const request = new DataAggregatorRequest({endpoint: `/${aggregator.id}`});
            const response = await request.updateAggregator(aggregator);
            return aggregator;*/
            if(dataAggregator.findIndex((a: any) => a.name === aggregator.name && a.id !== aggregator.id) !== -1){
                return thunkAPI.rejectWithValue({message: ResponseMessages.EXISTS});
            }
            dataAggregator = dataAggregator.map((a: any) => a.id === aggregator.id ? aggregator : a);
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
            return dataAggregator.find((a: any) => a.id === aggregatorId);
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
            dataAggregator.filter((a: any) => a.id !== id)
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
