import annyang from 'annyang';
import {ENABLE_DEBUG_VOICE_CONTROL, ENABLE_VOICE_CONTROL} from "@utils/constants/app";

export const PREFIX_COMMAND_NAME = "(please) (let\'s)";

class CVoiceControl{

    static initCommands(data, VoiceControl){
        if (annyang && ENABLE_VOICE_CONTROL) {
            annyang.debug(ENABLE_DEBUG_VOICE_CONTROL);
            annyang.addCommands({...VoiceControl.getCommands(data)});
            CVoiceControl.start();
        }
    }

    static removeCommands(data, VoiceControl){
        if (annyang && ENABLE_VOICE_CONTROL) {
            const commands = [...VoiceControl.getCommandsNames(data)];
            annyang.removeCommands(commands);
            if(commands.length === 0) {
                CVoiceControl.stop();
            }
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