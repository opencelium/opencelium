import {createAsyncThunk} from "@reduxjs/toolkit";
import {WidgetRequest} from "@request/dashboard/Widget";
import {errorHandler} from "../../../components/utils";

export const getAllWidgets = createAsyncThunk(
    'widget/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new WidgetRequest();
            const response = await request.getAllWidgets();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    getAllWidgets,
}