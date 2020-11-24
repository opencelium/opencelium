import annyang from 'annyang';
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
        if (annyang && ENABLE_VOICE_CONTROL && this.allRegisteredControls.indexOf(VoiceControl.name) === -1) {
            annyang.debug(ENABLE_DEBUG_VOICE_CONTROL);
            annyang.addCommands({...VoiceControl.getCommands(data)});
            this.registerCommands(data, VoiceControl);
            this.start();
        }
    }

    static removeCommands(data, VoiceControl){
        if (annyang && ENABLE_VOICE_CONTROL) {
            const commandNames = [...VoiceControl.getCommandsNames(data)];
            annyang.removeCommands(commandNames);
            this.unregisterCommands(data, VoiceControl);
            if(commandNames.length === 0) {
                this.stop();
            }
        }
    }

    static removeAll(){
        annyang.removeCommands();
        this.unregisterAll();
        this.stop();
    }

    static pauseAllCommands(){
        if (annyang && ENABLE_VOICE_CONTROL) {
            annyang.removeCommands();
        }
    }

    static unpauseAllCommands(){
        if (annyang && ENABLE_VOICE_CONTROL) {
            annyang.addCommands({...this.allRegisteredCommands});
        }
    }

    static initVoiceInput(currentValue, onChangeInput){
        if (annyang && ENABLE_VOICE_CONTROL) {
            this.pauseAllCommands();
            annyang.addCommands({'type *inputValue': (inputValue) => onChangeInput(`${currentValue}${inputValue}`)});
            annyang.addCommands({'clear': () => onChangeInput('')});
        }
    }

    static stopVoiceInput(){
        if (annyang && ENABLE_VOICE_CONTROL) {
            CVoiceControl.unpauseAllCommands();
            annyang.removeCommands(['type *inputValue', 'clear']);
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