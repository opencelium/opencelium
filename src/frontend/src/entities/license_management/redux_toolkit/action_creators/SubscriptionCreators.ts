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
    setCurrentSubscription,
}
