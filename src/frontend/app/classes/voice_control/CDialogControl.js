import {PREFIX_COMMAND_NAME} from "@classes/voice_control/CVoiceControl";

class CDialogControl{

    static getCommands(data) {
        let navigationCommands = {};
        if (data && data.component) {
            if(data.component.props.actions.length > 0){
                let index = data.component.props.actions.findIndex(action => action.label.toLowerCase() === 'ok');
                if(index !== -1){
                    navigationCommands[`${PREFIX_COMMAND_NAME} ok`] = data.component.props.actions[index].onClick;
                }
                index = data.component.props.actions.findIndex(action => action.label.toLowerCase() === 'cancel');
                if(index !== -1){
                    navigationCommands[`${PREFIX_COMMAND_NAME} cancel`] = data.component.props.actions[index].onClick;
                }
                index = data.component.props.actions.findIndex(action => action.label.toLowerCase() === 'close');
                if(index !== -1){
                    navigationCommands[`${PREFIX_COMMAND_NAME} close`] = data.component.props.actions[index].onClick;
                }
            }
        }
        return {
            ...navigationCommands,
        };
    }

    static getCommandsNames(data){
        const commands = this.getCommands(data);
        return Object.keys(commands).map(key => key);
    }
}

export default CDialogControl;