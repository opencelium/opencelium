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
import {getSlackWebhook} from "@entity/schedule/redux_toolkit/action_creators/SlackCreator";

export interface SlackState extends ICommonState{
    webhook: string,
    gettingWebhook: API_REQUEST_STATE,
}

const initialState: SlackState = {
    webhook: '',
    gettingWebhook: API_REQUEST_STATE.INITIAL,
    ...CommonState,
}

export const slackSlice = createSlice({
    name: 'slack',
    initialState,
    reducers: {},
    extraReducers: {
        [getSlackWebhook.pending.type]: (state) => {
            state.gettingWebhook = API_REQUEST_STATE.START;
        },
        [getSlackWebhook.fulfilled.type]: (state, action: PayloadAction<string>) => {
            state.gettingWebhook = API_REQUEST_STATE.FINISH;
            state.webhook = action.payload;
            state.error = null;
        },
        [getSlackWebhook.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingWebhook = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {} = slackSlice.actions;

export const actions = {}

export default slackSlice.reducer;
