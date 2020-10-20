import CCommonControl, {VOICE_CONTROL_REPLACE_SYMBOL} from "@classes/voice_control/CCommonControl";
import {PREFIX_COMMAND_NAME} from "@classes/voice_control/CVoiceControl";

export default class CConnectionListVoiceControl extends CCommonControl{

    static addCommands(component){
        return this.getAddCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_SYMBOL} connection`, component ? () => component.props.router.push('/connections/add') : null);
    }

    static removeCommands(component){
        return {};
    }

    static updateCommands(component){
        return {};
    }

    static listCommands(component){
        return this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_SYMBOL} connections`, component ? () => component.props.router.push('/connections') : null);
    }

    static getCommands(data = {component: null, currentItems: []}){
        const addCommands = this.addCommands(data.component);
        const removeCommands = this.removeCommands(data.component);
        const updateCommands = this.updateCommands(data.component);
        const listCommands = this.listCommands(data);
        return {
            ...addCommands,
            ...removeCommands,
            ...updateCommands,
            ...listCommands,
        };
    }

    static getCommandsNames(){
        const commands = CConnectionListVoiceControl.getCommands();
        return Object.keys(commands).map(key => commands[key]);
    }
}