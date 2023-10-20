/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import { TeamsRequest } from "@entity/schedule/requests/classes/Teams";

export const getAllTeams = createAsyncThunk(
    'schedule/notification/get/all/teams',
    async(data: never, thunkAPI) => {
        try {
            const request = new TeamsRequest();
            const response = await request.getAllTeams();
            return response.data.value;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getAllChannelsByTeam = createAsyncThunk(
    'schedule/notification/get/all/channels/by/team',
    async(teamId: string, thunkAPI) => {
        try {
            const request = new TeamsRequest({endpoint: `/${teamId}/channel/all`});
            const response = await request.getAllChannelsByTeam();
            return response.data.value;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    getAllTeams,
    getAllChannelsByTeam,
}
