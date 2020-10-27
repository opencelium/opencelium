import {PREFIX_COMMAND_NAME} from "@classes/voice_control/CVoiceControl";

class CHelpControl{

    static getCommands(data) {
        let navigationCommands = {};
        if (data && data.component) {
            if(typeof data.component.props.onClick === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} help on`] = () => data.component.props.onClick();
                navigationCommands[`${PREFIX_COMMAND_NAME} help off`] = () => document.querySelector('#___reactour > div').click();
            }
        }
        return {
            ...navigationCommands,
        };
    }

    static getCommandsNames(data){
        const commands = this.getCommands(data);
        return Object.keys(commands).map(key => key);
    }
}

export default CHelpControl;