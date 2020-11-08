import CCommonControl, {
    VOICE_CONTROL_DATA_SYMBOL,
    VOICE_CONTROL_REPLACE_COMMAND_SYMBOL
} from "@classes/voice_control/CCommonControl";
import {PREFIX_COMMAND_NAME} from "@classes/voice_control/CVoiceControl";

export default class CListVoiceControl extends CCommonControl{

    static addCommands(data){
        if(data.componentSingleName !== '' && data.url !== '' && data.exceptions.findIndex(exception => exception === 'add') === -1)
            return this.getAddCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} ${data.componentSingleName}`, data.component ? () => data.component.props.router.push(`/${data.url}/add`) : null);
        return {};
    }

    static updateCommands(data){
        if(data.componentSingleName !== '' && data.url !== '' && data.exceptions.findIndex(exception => exception === 'update') === -1)
            return this.getUpdateCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} ${VOICE_CONTROL_DATA_SYMBOL} ${data.componentSingleName}`, data);
        return {};
    }

    static viewCommands(data){
        if(data.componentSingleName !== '' && data.url !== '' && data.exceptions.findIndex(exception => exception === 'view') === -1)
            return this.getViewCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} ${VOICE_CONTROL_DATA_SYMBOL} ${data.componentSingleName}`, data);
        return {};
    }

    static openCommands(data){
        //if open commands does not work, check mapEntity.map of the "Entity"List component, it must have 'link' property, like in AppsList
        if(data.componentSingleName !== '' && data.currentItems.length > 0 && data.currentItems[0].mappedEntity.hasOwnProperty('link') && data.currentItems[0].mappedEntity.link !== ''
            && data.exceptions.findIndex(exception => exception === 'open') === -1)
            return this.getOpenCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} ${VOICE_CONTROL_DATA_SYMBOL} ${data.componentSingleName}`, data);
        return {};
    }

    static deleteCommands(data){
        if(data.componentSingleName !== '' && data.url !== '' && data.exceptions.findIndex(exception => exception === 'delete') === -1)
            return this.getDeleteCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} ${VOICE_CONTROL_DATA_SYMBOL} ${data.componentSingleName}`, data);
        return {};
    }

    static getCommands(data){
        let commandsData = {component: null, currentItems: [], componentSingleName: '', componentPluralName: '', url: '', exceptions: [], ...data};
        let commands = {};
        const focusSearchName = `${PREFIX_COMMAND_NAME} focus search`;
        let focusSearchField = document.getElementById('search_field');
        if(focusSearchField){
            commands[focusSearchName] = () => focusSearchField.focus();
        }
        commands = {...commands, ...this.addCommands(commandsData)};
        commands = {...commands, ...this.updateCommands(commandsData)};
        commands = {...commands, ...this.viewCommands(commandsData)};
        commands = {...commands, ...this.openCommands(commandsData)};
        commands = {...commands, ...this.deleteCommands(commandsData)};
        return commands;
    }

    static getCommandsNames(data){
        const commands = this.getCommands(data);
        return Object.keys(commands).map(key => key);
    }
}