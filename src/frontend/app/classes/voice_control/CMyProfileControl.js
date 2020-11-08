import {PREFIX_COMMAND_NAME} from "@classes/voice_control/CVoiceControl";

class CMyProfileControl{

    static getCommands(data) {
        let navigationCommands = {};
        if (data && data.component) {
            if(typeof data.component.handleChangeAppTour === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} switch application tour`] = () => data.component.handleChangeAppTour();
            }
            if(typeof data.component.handleChangeTheme === 'function'){
                let {t} = data.component.props;
                navigationCommands[`${PREFIX_COMMAND_NAME} select ${t('THEME.DEFAULT')} theme`] = () => data.component.handleChangeTheme('default');
                navigationCommands[`${PREFIX_COMMAND_NAME} select ${t('THEME.OTHER')} theme`] = () => data.component.handleChangeTheme('other');
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

export default CMyProfileControl;