/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {capitalize, consoleLog} from "@application/utils/utils";

export const VOICE_CONTROL_REPLACE_COMMAND_SYMBOL = '#';
export const VOICE_CONTROL_DATA_SYMBOL = '$';

export default class CCommonControl{

    static defineCommands(name, value, commandTags){
        let commands = {};
        for(let i = 0; i < commandTags.length; i++){
            commands[name.replace(VOICE_CONTROL_REPLACE_COMMAND_SYMBOL, commandTags[i])] = value;
        }
        return commands;

    }

    static getAddCommands(name, value){
        const commandTags = ['add', 'insert', 'create'];
        return CCommonControl.defineCommands(name, value, commandTags);
    }
    /*
    * TODO: Ask Jakob about data tags for delete commands
    */
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

    static getOpenCommands(name, data){
        const commandTags = ['open', 'load'];
        const dataTags = ['first', 'second', 'third', 'fourth'];
        let commands = {};
        for(let i = 0; i < data.currentItems.length; i++){
            const title = data.currentItems[i].hasOwnProperty('title') ? data.currentItems[i].title : data.currentItems[i].name;
            let value = data.currentItems[i].mappedEntity.hasOwnProperty('openEntityEvent') ? () => data.currentItems[i].mappedEntity.openEntityEvent() : null;
            if(!value) {
                value = data.component ? () => data.component.props.router.push(`${data.currentItems[i].mappedEntity.link}`) : null;
            }
            commands = {...commands, ...CCommonControl.defineCommands(name.replace(VOICE_CONTROL_DATA_SYMBOL, title), value, commandTags)};
            commands = {...commands, ...CCommonControl.defineCommands(name.replace(VOICE_CONTROL_DATA_SYMBOL, dataTags[i]), value, commandTags)};
        }
        return commands;
    }

    static getListCommands(name, value){
        const commandTags = ['all', 'list of', 'open'];
        return CCommonControl.defineCommands(name, value, commandTags);
    }
}