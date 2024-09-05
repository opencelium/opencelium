import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import SubscriptionRequest from "@entity/license_management/requests/classes/SubscriptionRequest";

export const getAllSubscriptions = createAsyncThunk(
    'subscription/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new SubscriptionRequest();
            //const response = await request.getAll();
            //return response.data;
            return [
                {
                    _id: '1',
                    type: 'enterprise',
                    endDate: + new Date('1. October 2024'),
                    duration: '12 Monate',
                    startDate: + new Date('2. October 2023'),
                    totalOperationUsage: 1000000,
                    currentOperationUsage: 540000,
                }
            ]
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
            return {
                _id: '1',
                type: 'enterprise',
                endDate: + new Date('1. October 2024'),
                duration: '12 Monate',
                startDate: + new Date('2. October 2023'),
                totalOperationUsage: 1000000,
                currentOperationUsage: 540000,
            }
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
            const response = await request.setCurrent(subscriptionId);
            return response.data;
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
