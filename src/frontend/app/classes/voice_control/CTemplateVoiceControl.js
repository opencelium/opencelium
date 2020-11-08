import {PREFIX_COMMAND_NAME} from "@classes/voice_control/CVoiceControl";
import CCommonControl from "@classes/voice_control/CCommonControl";

class CTemplateVoiceControl extends CCommonControl{

    static getCommands(data) {
        let navigationCommands = {};
        if (data && data.component) {
            if(typeof data.component.convert === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} convert ${data.component.props.data.template.name} template`] = () => data.component.convert();
            }
            if(typeof data.component.exportTemplate === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} download ${data.component.props.template.name} template`] = () => data.component.exportTemplate(null, data.component.props.template);
            }
            if(typeof data.component.convertAll === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} convert all templates`] = () => data.component.convertAll();
            }
            if(typeof data.component.toggleImport === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} import template`] = () => data.component.toggleImport();
                navigationCommands[`${PREFIX_COMMAND_NAME} cancel import (template)`] = () => data.component.toggleImport();
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

export default CTemplateVoiceControl;