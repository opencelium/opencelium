import {createAsyncThunk} from "@reduxjs/toolkit";
import IAuthUser from "@entity/user/interfaces/IAuthUser";
import {errorHandler} from "@application/utils/utils";
import UserDetailRequest from "@entity/user/requests/classes/UserDetailRequest";

export const updateUserDetail = createAsyncThunk(
    'user_detail/update',
    async(user: IAuthUser, thunkAPI) => {
        try {
            const request = new UserDetailRequest({endpoint: `/${user.id}`});
            await request.updateUserDetail(user.userDetail);
            return user;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    updateUserDetail,
}