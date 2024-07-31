import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import SubscriptionRequest from "@entity/application/requests/classes/SubscriptionRequest";

export const getAllSubscriptions = createAsyncThunk(
    'subscription/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new SubscriptionRequest();
            const response = await request.getAll();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    getAllSubscriptions,
}
