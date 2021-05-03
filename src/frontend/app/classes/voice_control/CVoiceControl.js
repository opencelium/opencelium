/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

//import annyang from 'annyang';
import {ENABLE_DEBUG_VOICE_CONTROL, ENABLE_VOICE_CONTROL} from "@utils/constants/app";

export const PREFIX_COMMAND_NAME = "(please) (let\'s)";

class CVoiceControl{

    static allRegisteredCommands = {};

    static allRegisteredCommandNames = [];

    static allRegisteredControls = [];

    static registerCommands(data, VoiceControl){
        if(VoiceControl && VoiceControl.name) {
            const commands = {...VoiceControl.getCommands(data)};
            const commandNames = [...VoiceControl.getCommandsNames(data)];
            this.allRegisteredCommands = {...this.allRegisteredCommands, ...commands};
            this.allRegisteredCommandNames = Array.from(new Set([...this.allRegisteredCommandNames,...commandNames]));
            this.allRegisteredControls.push(VoiceControl.name);
        }
    }

    static unregisterCommands(data, VoiceControl){
        if(VoiceControl && VoiceControl.name) {
            const commandNames = [...VoiceControl.getCommandsNames(data)];
            for (let i = 0; i < commandNames.length; i++) {
                delete this.allRegisteredCommands[commandNames[i]];
            }
            this.allRegisteredCommandNames = this.allRegisteredCommandNames.filter(name => commandNames.indexOf(name) === -1);
            this.allRegisteredControls = this.allRegisteredControls.filter(control => control !== VoiceControl.name);
        }
    }

    static unregisterAll(){
        this.allRegisteredCommands = {};
        this.allRegisteredCommandNames = [];
        this.allRegisteredControls = [];
    }

    static initCommands(data, VoiceControl){
        if (ENABLE_VOICE_CONTROL && this.allRegisteredControls.indexOf(VoiceControl.name) === -1) {
            annyang.debug(ENABLE_DEBUG_VOICE_CONTROL);
            annyang.addCommands({...VoiceControl.getCommands(data)});
            this.registerCommands(data, VoiceControl);
            this.start()
        }
    }

    static removeCommands(data, VoiceControl){
        if (ENABLE_VOICE_CONTROL) {
            const commandNames = [...VoiceControl.getCommandsNames(data)];
            annyang.removeCommands(commandNames);
            this.unregisterCommands(data, VoiceControl);
            if (commandNames.length === 0) {
                this.stop();
            }
        }
    }

    static removeAll(){
        if(ENABLE_VOICE_CONTROL) {
            annyang.removeCommands();
            this.unregisterAll();
            this.stop();
        }
    }

    static pauseAllCommands(){
        if (ENABLE_VOICE_CONTROL) {
            annyang.removeCommands();
        }
    }

    static unpauseAllCommands(){
        if (ENABLE_VOICE_CONTROL) {
            annyang.addCommands({...this.allRegisteredCommands});
        }
    }

    static initVoiceInput(currentValue, onInputChange){
        if (ENABLE_VOICE_CONTROL) {
            this.pauseAllCommands();
            annyang.addCommands({'type *inputValue': (inputValue) => onInputChange(`${currentValue}${inputValue.toLowerCase()}`)});
            annyang.addCommands({'clear': () => onInputChange('')});
        }
    }

    static stopVoiceInput(){
        if (ENABLE_VOICE_CONTROL) {
            CVoiceControl.unpauseAllCommands();
            annyang.removeCommands(['type *inputValue', 'clear']);
        }
    }

    static initVoiceSelect(component){
        if (ENABLE_VOICE_CONTROL) {
            this.pauseAllCommands();
            const change = (inputValue) => {
                const numbers = {
                    1: ['1', 'one', 'first'], 2: ['2', 'two', 'second'], 3: ['3', 'three', 'third'], 4: ['4', 'four', 'fourth'], 5: ['5', 'five', 'fifth'],
                    6: ['6', 'six', 'sixth'], 7: ['7', 'seven', 'seventh'], 8: ['8', 'eight', 'eighth'], 9: ['9', 'nine', 'ninth'],
                };
                let number = -1;
                for(let prop in numbers){
                    if(numbers[prop].indexOf(inputValue) !== -1){
                        number = parseInt(prop);
                        break;
                    }
                }
                const option = component.props.options.find((option, key) => {
                    return key + 1 === number;
                });
                if(option) {
                    component.props.onChange(option);
                }
            };
            annyang.addCommands({'type *inputValue': (inputValue) => component.onInputChange(`${component.state.inputValue}${inputValue.toLowerCase()}`)});
            annyang.addCommands({'clear': () => component.onInputChange('')});
            annyang.addCommands({'select *inputValue': change});
        }
    }

    static stopVoiceSelect(){
        if (ENABLE_VOICE_CONTROL) {
            CVoiceControl.unpauseAllCommands();
            annyang.removeCommands(['type *inputValue', 'clear', 'select *inputValue']);
        }
    }

    //start voice recognition and turn on mic
    static start(){
        annyang.start();
    }

    //stop voice recognition and turn off mic
    static stop(){
        annyang.abort();
    }

    //stop voice recognition
    static pause(){
        annyang.pause();
    }

    //start voice recognition
    static resume(){
        annyang.resume();
    }

    static isListening(){
        if(annyang) {
            return annyang.isListening();
        }
        return -1;
    }
}

export default CVoiceControl;