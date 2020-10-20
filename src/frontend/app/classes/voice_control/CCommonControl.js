export const VOICE_CONTROL_REPLACE_SYMBOL = '#';

export default class CCommonControl{

    static defineCommands(name, value, commandTags){
        let commands = {};
        for(let i = 0; i < commandTags.length; i++){
            commands[name.replace(VOICE_CONTROL_REPLACE_SYMBOL, commandTags[i])] = value;
        }
        return commands;

    }

    static getAddCommands(name, value){
        const commandTags = ['add', 'insert', 'create'];
        return CCommonControl.defineCommands(name, value, commandTags);
    }

    static getRemoveCommands(name, value){
        const commandTags = ['remove', 'delete'];
        return CCommonControl.defineCommands(name, value, commandTags);
    }

    static getUpdateCommands(name, value){
        const commandTags = ['update', 'refresh'];
        return CCommonControl.defineCommands(name, value, commandTags);
    }

    static getListCommands(name, value){
        const commandTags = ['all', 'list of'];
        return CCommonControl.defineCommands(name, value, commandTags);
    }
}