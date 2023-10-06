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
