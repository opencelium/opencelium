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
export const getCurrentSubscriptionOnlyForSchedules = createAsyncThunk(
    'subscription/get/current/only-for-schedules',
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
    async(data: {page: number, size: number, startDate: number, endDate: number, } = {page: 0, size: 10000, startDate: 0, endDate: 0}, thunkAPI) => {
        try {
            const timeRangeParams = data.startDate && data.endDate ? `&startDate=${data.startDate}&endDate=${data.endDate}` : '';
            const request = new SubscriptionRequest({endpoint: `/operation/usage?page=${data.page}&size=${data.size}${timeRangeParams}`});
            const response = await request.getOperationUsageEntries();
            const content = response.data.content.filter(c => c.totalUsage !== 0);
            return {...response.data, content};
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getOperationUsageDetails = createAsyncThunk(
    'subscription/get/operation/usage/details',
    async(data: {page: number, size: number, startDate: number, endDate: number, entryId: number} = {page: 0, size: 5, entryId: 0, startDate: 0, endDate: 0}, thunkAPI) => {
        try {
            const timeRangeParams = data.startDate && data.endDate ? `&startDate=${data.startDate}&endDate=${data.endDate}` : '';
            const request = new SubscriptionRequest({endpoint: `/operation/usage/${data.entryId}/details?page=${data.page}&size=${data.size}&sort=startDate,desc${timeRangeParams}`});
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
export const importCredits = createAsyncThunk(
    'subscription/import/credits',
    async(creditsFile: Blob[], thunkAPI) => {
        try {
            const formData = new FormData();
            formData.append('file', creditsFile[0]);
            const request = new SubscriptionRequest({isFormData: true});
            await request.importCredits(formData);
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
    importCredits,
    getCurrentSubscriptionOnlyForSchedules,
}
