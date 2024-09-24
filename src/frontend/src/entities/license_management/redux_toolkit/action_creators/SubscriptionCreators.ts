import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import SubscriptionRequest from "@entity/license_management/requests/classes/SubscriptionRequest";
import {
    OperationUsageDetailModel,
    OperationUsageEntryModel
} from "@entity/license_management/requests/models/SubscriptionModel";
import OperationUsageDetails from "@entity/license_management/collections/OperationUsageDetails";

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
    async(data: never, thunkAPI) => {
        try {
            const page = 0;
            const size = 10000;
            const request = new SubscriptionRequest({endpoint: `/operation/usage?page=${page}&size=${size}`});
            const response = await request.getOperationUsageEntries();
            return response.data.content;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getOperationUsageDetails = createAsyncThunk(
    'subscription/get/operation/usage/details',
    async(entryId: number, thunkAPI) => {
        try {
            const page = 0;
            const size = 10;
            const request = new SubscriptionRequest({endpoint: `/operation/usage/${entryId}/details?page=${page}&size=${size}`});
            const response = await request.getOperationUsageDetails();
            return response.data.content;
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
