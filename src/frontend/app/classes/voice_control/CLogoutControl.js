class CLogoutControl{

    static getCommands() {
        return {};
    }

    static getCommandsNames(){
        const commands = this.getCommands();
        return Object.keys(commands).map(key => key);
    }
}

export default CLogoutControl;