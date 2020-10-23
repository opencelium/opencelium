import annyang from 'annyang';
import CListVoiceControl from "@classes/voice_control/CListVoiceControl";

export const PREFIX_COMMAND_NAME = "(please) (let\'s)";

class CVoiceControl{

    static getCommonCommands(){
        const offCommandName = `${PREFIX_COMMAND_NAME} off`;
        const pauseCommandName = `${PREFIX_COMMAND_NAME} pause`;
        return {
            [offCommandName]: () => CVoiceControl.stop(),
            [pauseCommandName]: () => CVoiceControl.pause(),
        };
    }

    static getCommonCommandsNames(){
        const commands = CVoiceControl.getCommonCommands();
        return Object.keys(commands).map(key => commands[key]);
    }

    static initCommands(data){
        if (annyang) {
            annyang.addCommands({...CVoiceControl.getCommonCommands(), ...CListVoiceControl.getCommands(data)}, true);
            CVoiceControl.start();
        }
    }

    static removeCommands(data){
        if (annyang) {
            annyang.removeCommands([...CVoiceControl.getCommonCommandsNames(), ...CListVoiceControl.getCommandsNames(data)]);
            CVoiceControl.stop();
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
}

export default CVoiceControl;