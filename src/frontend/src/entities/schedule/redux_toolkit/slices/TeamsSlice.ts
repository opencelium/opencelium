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

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {ICommonState} from "@application/interfaces/core";
import {CommonState} from "@application/utils/store";
import {TeamChannelModel, TeamModel} from "@entity/schedule/requests/models/Teams";
import {getAllChannelsByTeam, getAllTeams} from "@entity/schedule/redux_toolkit/action_creators/TeamsCreators";

export interface TeamsState extends ICommonState{
    teams: TeamModel[],
    channels: TeamChannelModel[],
    gettingAllTeams: API_REQUEST_STATE,
    gettingAllChannelsByTeam: API_REQUEST_STATE,
}

const initialState: TeamsState = {
    teams: [],
    channels: [],
    gettingAllTeams: API_REQUEST_STATE.INITIAL,
    gettingAllChannelsByTeam: API_REQUEST_STATE.INITIAL,
    ...CommonState,
}

export const teamsSlice = createSlice({
    name: 'teams',
    initialState,
    reducers: {
        clearAllTeams: (state) => {
            state.teams = [];
        },
        clearAllChannels: (state) => {
            state.channels = [];
        },
    },
    extraReducers: {
        [getAllTeams.pending.type]: (state) => {
            state.gettingAllTeams = API_REQUEST_STATE.START;
        },
        [getAllTeams.fulfilled.type]: (state, action: PayloadAction<TeamModel[]>) => {
            state.gettingAllTeams = API_REQUEST_STATE.FINISH;
            state.teams = action.payload;
            state.error = null;
        },
        [getAllTeams.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingAllTeams = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllChannelsByTeam.pending.type]: (state) => {
            state.gettingAllChannelsByTeam = API_REQUEST_STATE.START;
        },
        [getAllChannelsByTeam.fulfilled.type]: (state, action: PayloadAction<TeamChannelModel[]>) => {
            state.gettingAllChannelsByTeam = API_REQUEST_STATE.FINISH;
            state.channels = action.payload;
            state.error = null;
        },
        [getAllChannelsByTeam.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingAllChannelsByTeam = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    clearAllTeams, clearAllChannels,
} = teamsSlice.actions;

export const actions = {
}

export default teamsSlice.reducer;
