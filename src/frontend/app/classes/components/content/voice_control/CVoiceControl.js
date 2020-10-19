import annyang from 'annyang';

class CVoiceControl{

    static getCommonCommands(){
        return {
            'open celium off': () => CVoiceControl.stop(),
            'open celium pause': () => CVoiceControl.pause(),
        };
    }

    static getCommonCommandsNames(){
        const commands = CVoiceControl.getCommonCommands();
        return Object.keys(commands).map(key => commands[key]);
    }

    static initCommands(component, ComponentControl){
        if (annyang) {
            annyang.addCommands({...CVoiceControl.getCommonCommands(), ...ComponentControl.getCommands(component)});
            CVoiceControl.start();
        }
    }

    static removeCommands(ComponentControl){
        if (annyang) {
            annyang.removeCommands([...CVoiceControl.getCommonCommandsNames(), ...ComponentControl.getCommandsNames()]);
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