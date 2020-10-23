import {capitalize, consoleLog} from "@utils/app";

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

    static getDeleteCommands(name, data){
        const commandTags = ['remove', 'delete'];
        //const dataTags = ['first', 'second', 'third', 'fourth'];
        let commands = {};
        if(data && data.component){
            let deleteAction = null;
            if(data.hasOwnProperty('deleteActionName') && data.deleteActionName !== '' && data.component.props.hasOwnProperty(data.deleteActionName)) {
                deleteAction = data.component.props[data.deleteActionName];
            } else {
                if (data.component.props.hasOwnProperty(`delete${capitalize(data.componentSingleName)}`)) {
                    deleteAction = data.component.props[`delete${capitalize(data.componentSingleName)}`];
                }
            }
            if(deleteAction !== null){
                for (let i = 0; i < data.currentItems.length; i++) {
                    let value = () => deleteAction(data.currentItems[i].mappedEntity);
                    commands = {...commands, ...CCommonControl.defineCommands(name.replace(VOICE_CONTROL_DATA_SYMBOL, data.currentItems[i].mappedEntity.title), value, commandTags)};
                    //commands = {...commands, ...CCommonControl.defineCommands(name.replace(VOICE_CONTROL_DATA_SYMBOL, dataTags[i]), value, commandTags)};
                }
            } else{
                consoleLog('You have forgot to import the delete "entity" method in "Entity"Layout');
            }
        }
        return commands;
    }

    static getUpdateCommands(name, data){
        const commandTags = ['update', 'refresh'];
        const dataTags = ['first', 'second', 'third', 'fourth'];
        let commands = {};
        for(let i = 0; i < data.currentItems.length; i++){
            let value = data.component ? () => data.component.props.router.push(`/${data.url}/${data.currentItems[i].mappedEntity.id}/update`) : null;
            commands = {...commands, ...CCommonControl.defineCommands(name.replace(VOICE_CONTROL_DATA_SYMBOL, data.currentItems[i].mappedEntity.title), value, commandTags)};
            commands = {...commands, ...CCommonControl.defineCommands(name.replace(VOICE_CONTROL_DATA_SYMBOL, dataTags[i]), value, commandTags)};
        }
        return commands;
    }

    static getViewCommands(name, data){
        const commandTags = ['view'];
        const dataTags = ['first', 'second', 'third', 'fourth'];
        let commands = {};
        for(let i = 0; i < data.currentItems.length; i++){
            let value = data.component ? () => data.component.props.router.push(`/${data.url}/${data.currentItems[i].mappedEntity.id}/view`) : null;
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