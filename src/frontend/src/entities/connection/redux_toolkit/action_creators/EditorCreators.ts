import { createAsyncThunk } from "@reduxjs/toolkit";
import { RemoteApiRequestProps } from "@application/requests/interfaces/IApplication";
import { ApplicationRequest } from "@application/requests/classes/Application";
import { errorHandler } from "@application/utils/utils";

export const requestRemoteApi = createAsyncThunk(
  'application/remote_request/send',
  async(requestProps: RemoteApiRequestProps, thunkAPI) => {
      try{
          const request = new ApplicationRequest();
          const response = await request.remoteApiRequest(requestProps);
          return response.data;
      }catch(e){
          return thunkAPI.rejectWithValue(errorHandler(e));
      }
  }
)

export default {
  requestRemoteApi
}