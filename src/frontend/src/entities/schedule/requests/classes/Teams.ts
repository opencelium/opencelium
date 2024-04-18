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
import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {GetAllChannelsResponse, GetAllTeamsResponse, ITeams} from "../interfaces/ITeams";
import {TeamChannelModel, TeamModel} from "@entity/schedule/requests/models/Teams";


export class TeamsRequest extends Request implements ITeams{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'message/tools/teams/team', ...settings});
    }

    async getAllTeams(): Promise<AxiosResponse<GetAllTeamsResponse>>{
        this.endpoint = "/all";
        return super.get<GetAllTeamsResponse>();
    }

    async getAllChannelsByTeam(): Promise<AxiosResponse<GetAllChannelsResponse>>{
        return super.get<GetAllChannelsResponse>();
    }
}