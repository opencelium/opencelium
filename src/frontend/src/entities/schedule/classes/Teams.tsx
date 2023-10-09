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

import {RootState, useAppSelector} from "@application/utils/store";
import {TeamChannelModel, TeamModel} from "@entity/schedule/requests/models/Teams";
import {OptionProps} from "@app_component/base/input/select/interfaces";

export default class Teams {

    static getReduxState(){
        return useAppSelector((state: RootState) => state.teamsReducer);
    }

    static getTeamsOptionsForSelect(teams: TeamModel[]): OptionProps[]{
        return teams.map(team => {
            return {label: team.name, value: team.id}
        });
    }

    static getChannelsOptionsForSelect(channels: TeamChannelModel[]): OptionProps[]{
        return channels.map(channel => {
            return {label: channel.name, value: channel.id}
        });
    }

}
