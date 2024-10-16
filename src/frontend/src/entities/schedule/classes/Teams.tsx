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

    static getLabelForOption(team: TeamModel): string {
        return `${team.name} (${team.description})`;
    }

    static getTeamOptionById(id: string, teams: TeamModel[]): any {
        const team = teams.find(team => team.id === id);
        if(!team){
            return null;
        }
        return {
            label: this.getLabelForOption(team),
            value: team.id,
        }
    }

    static getTeamsOptionsForSelect(teams: TeamModel[]): OptionProps[]{
        return teams.map(team => {
            return {label: this.getLabelForOption(team), value: team.id}
        });
    }

    static getChannelOptionById(id: string, channels: TeamChannelModel[]): any {
        const channel = channels.find(channel => channel.id === id);
        if(!channel){
            return null;
        }
        return {
            label: channel.name,
            value: channel.id,
        }
    }

    static getChannelsOptionsForSelect(channels: TeamChannelModel[]): OptionProps[]{
        return channels.map(channel => {
            return {label: channel.name, value: channel.id}
        });
    }

}
