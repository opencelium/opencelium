export default class CConnectionVoiceControl{

    static getCommands(component = null){
        return {
            'open celium create connection': component ? () => component.props.router.push('/connections/add') : null,
        };
    }

    static getCommandsNames(){
        const commands = CConnectionVoiceControl.getCommands();
        return Object.keys(commands).map(key => commands[key]);
    }
}