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

import {AxiosResponse} from "axios";
import {TeamChannelModel, TeamModel} from "@entity/schedule/requests/models/Teams";

export interface GetAllResponse<T, V> {
    type: T,
    value: V[]
}

export type GetAllTeamsResponse = GetAllResponse<"CHANNEL", TeamModel>;

export type GetAllChannelsResponse = GetAllResponse<"TEAM", TeamChannelModel>;

export interface ITeams{

    //to get all teams
    getAllTeams(): Promise<AxiosResponse<GetAllTeamsResponse>>,

    //to get all channels by team
    getAllChannelsByTeam(): Promise<AxiosResponse<GetAllChannelsResponse>>,

}
