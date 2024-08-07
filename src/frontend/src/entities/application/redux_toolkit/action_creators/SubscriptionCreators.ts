import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import SubscriptionRequest from "@entity/application/requests/classes/SubscriptionRequest";
import SubscriptionModel from "@entity/application/requests/models/SubscriptionModel";

export const getAllSubscriptions = createAsyncThunk(
    'subscription/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new SubscriptionRequest();
            //const response = await request.getAll();
            //return response.data;
            const testData: SubscriptionModel[] = [{
                _id: '1',
                type: 'enterprise',
                endDate: + new Date(),
                duration: '12 Monate',
                startDate: + new Date(),
                totalOperationUsage: 1000000,
            },{
                _id: '2',
                type: 'professional',
                endDate: + new Date(),
                duration: '12 Monate',
                startDate: + new Date(),
                totalOperationUsage: 1000000,
            }];
            return testData;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getCurrentSubscription = createAsyncThunk(
    'subscription/get/current',
    async(data: never, thunkAPI) => {
        try {
            const request = new SubscriptionRequest();
            //const response = await request.getCurrent();
            //return response.data;
            return {_id: '1'}
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const setCurrentSubscription = createAsyncThunk(
    'subscription/set/current',
    async(subscriptionId: string, thunkAPI) => {
        try {
            const request = new SubscriptionRequest();
            await request.setCurrent(subscriptionId);
            return subscriptionId;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    getAllSubscriptions,
    getCurrentSubscription,
    setCurrentSubscription,
}
