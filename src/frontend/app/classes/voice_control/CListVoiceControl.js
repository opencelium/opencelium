import CCommonControl, {
    VOICE_CONTROL_DATA_SYMBOL,
    VOICE_CONTROL_REPLACE_SYMBOL
} from "@classes/voice_control/CCommonControl";
import {PREFIX_COMMAND_NAME} from "@classes/voice_control/CVoiceControl";

export default class CListVoiceControl extends CCommonControl{

    static addCommands(data){
        return this.getAddCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_SYMBOL} ${data.componentSingleName}`, data.component ? () => data.component.props.router.push(`/${data.url}/add`) : null);
    }

    static updateCommands(data){
        return this.getUpdateCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_SYMBOL} ${VOICE_CONTROL_DATA_SYMBOL} ${data.componentSingleName}`, data);
    }

    static viewCommands(data){
        return this.getViewCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_SYMBOL} ${VOICE_CONTROL_DATA_SYMBOL} ${data.componentSingleName}`, data);
    }

    static deleteCommands(data){
        return this.getDeleteCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_SYMBOL} ${VOICE_CONTROL_DATA_SYMBOL} ${data.componentSingleName}`, data);
    }

    static listCommands(data){
        return this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_SYMBOL} ${data.componentPluralName}`, data.component ? () => data.component.props.router.push(`/${data.url}`) : null);
    }

    static getCommands(data){
        let commandsData = {component: null, currentItems: [], componentSingleName: '', componentPluralName: '', url: '', ...data};
        const addCommands = this.addCommands(commandsData);
        const updateCommands = this.updateCommands(commandsData);
        const viewCommands = this.viewCommands(commandsData);
        const deleteCommands = this.deleteCommands(commandsData);
        const listCommands = this.listCommands(commandsData);
        return {
            ...addCommands,
            ...updateCommands,
            ...viewCommands,
            ...deleteCommands,
            ...listCommands,
        };
    }

    static getCommandsNames(data){
        const commands = CListVoiceControl.getCommands(data);
        return Object.keys(commands).map(key => commands[key]);
    }
}