import {createAsyncThunk} from "@reduxjs/toolkit";
import {ApplicationRequest} from "@application/requests/classes/Application";
import {errorHandler} from "@application/utils/utils";


export const checkConnection = createAsyncThunk(
    'check/connection',
    async(data: never, thunkAPI) => {
        try{
            const request = new ApplicationRequest();
            await request.getVersion();
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    checkConnection,
}
