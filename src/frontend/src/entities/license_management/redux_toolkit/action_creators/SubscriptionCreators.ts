import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import SubscriptionRequest from "@entity/license_management/requests/classes/SubscriptionRequest";
export const getCurrentSubscription = createAsyncThunk(
    'subscription/get/current',
    async(data: never, thunkAPI) => {
        try {
            const request = new SubscriptionRequest();
            const response = await request.getCurrent();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getOperationUsageEntries = createAsyncThunk(
    'subscription/get/operation/usage',
    async(data: {page: number, size: number} = {page: 0, size: 10000}, thunkAPI) => {
        try {
            const request = new SubscriptionRequest({endpoint: `/operation/usage?page=${data.page}&size=${data.size}`});
            const response = await request.getOperationUsageEntries();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getOperationUsageDetails = createAsyncThunk(
    'subscription/get/operation/usage/details',
    async(data: {page: number, size: number, entryId: number} = {page: 0, size: 5, entryId: 0}, thunkAPI) => {
        try {
            const request = new SubscriptionRequest({endpoint: `/operation/usage/${data.entryId}/details?page=${data.page}&size=${data.size}&sort=startDate,desc`});
            const response = await request.getOperationUsageDetails();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const setCurrentSubscription = createAsyncThunk(
    'subscription/set/current',
    async(subscriptionId: string, thunkAPI) => {
        try {
            const request = new SubscriptionRequest({endpoint: `/${subscriptionId}`});
            const response = await request.setCurrent();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    getCurrentSubscription,
    getOperationUsageEntries,
    getOperationUsageDetails,
    setCurrentSubscription,
}
