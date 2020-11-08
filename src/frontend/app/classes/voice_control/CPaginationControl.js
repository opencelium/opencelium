import {PREFIX_COMMAND_NAME} from "@classes/voice_control/CVoiceControl";

class CPaginationControl{

    static getCommands(data) {
        let navigationCommands = {};
        if (data && data.component) {
            if(typeof data.component.openNextPage === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} next page`] = () => data.component.openNextPage();
            }
            if(typeof data.component.openPrevPage === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} previous page`] = () => data.component.openPrevPage();
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

export default CPaginationControl;