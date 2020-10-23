export const VOICE_CONTROL_REPLACE_SYMBOL = '#';
export const VOICE_CONTROL_DATA_SYMBOL = '$';

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

    static getUpdateCommands(name, data){
        const commandTags = ['update', 'refresh'];
        const dataTags = ['first', 'second', 'third', 'fourth'];
        let commands = {};
        for(let i = 0; i < data.currentItems.length; i++){
            let value = data.component ? () => data.component.props.router.push(`/connections/${data.currentItems[i].connectionId}/update`) : null;
            commands = {...commands, ...CCommonControl.defineCommands(name.replace(VOICE_CONTROL_DATA_SYMBOL, data.currentItems[i].title), value, commandTags)};
            commands = {...commands, ...CCommonControl.defineCommands(name.replace(VOICE_CONTROL_DATA_SYMBOL, dataTags[i]), value, commandTags)};
        }
        return commands;
    }

    static getListCommands(name, value){
        const commandTags = ['all', 'list of'];
        return CCommonControl.defineCommands(name, value, commandTags);
    }
}