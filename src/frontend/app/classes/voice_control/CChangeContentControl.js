import {PREFIX_COMMAND_NAME} from "@classes/voice_control/CVoiceControl";

class CChangeContentControl{

    static getCommands(data) {
        let navigationCommands = {};
        if (data && data.component && data.component.props.navigationPage) {
            if(typeof data.component.props.navigationPage.nextPage === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} next step`] = () => data.component.props.navigationPage.nextPage();
            }
            if(typeof data.component.props.navigationPage.prevPage === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} previous step`] = () => data.component.props.navigationPage.prevPage();
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

export default CChangeContentControl;