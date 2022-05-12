/*
 * Copyright (C) <2022>  <becon GmbH>
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

import CCommonControl, {VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} from "@entity/connection/components/classes/voice_control/CCommonControl";
import CVoiceControl, {PREFIX_COMMAND_NAME} from "@entity/connection/components/classes/voice_control/CVoiceControl";

/**
 * Class for AppVoiceControl for whole Application voice control
 */
class CAppVoiceControl extends CCommonControl {

    static getCommands(data) {
        const offCommandName = `${PREFIX_COMMAND_NAME} voice off`;
        const pauseCommandName = `${PREFIX_COMMAND_NAME} pause`;
        const scrollDownName = `${PREFIX_COMMAND_NAME} scroll down`;
        const scrollUpName = `${PREFIX_COMMAND_NAME} scroll up`;
        let navigationCommands = {};
        if (data && data.component && data.component.props.hasOwnProperty('router')) {
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} users`, () => data.component.props.router.push(`/users`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} groups`, () => data.component.props.router.push(`/usergroups`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} connectors`, () => data.component.props.router.push(`/connectors`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} connections`, () => data.component.props.router.push(`/connections`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} scheduler`, () => data.component.props.router.push(`/schedules`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} admin`, () => data.component.props.router.push(`/admin_cards`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} applications`, () => data.component.props.router.push(`/apps`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} converter`, () => data.component.props.router.push(`/template_converter`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} invokers`, () => data.component.props.router.push(`/invokers`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} notification templates`, () => data.component.props.router.push(`/notification_templates`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} templates`, () => data.component.props.router.push(`/templates`))};
            navigationCommands = {...navigationCommands, ...this.getListCommands(`${PREFIX_COMMAND_NAME} ${VOICE_CONTROL_REPLACE_COMMAND_SYMBOL} my profile`, () => data.component.props.router.push(`/myprofile`))};
        }
        return {
            [offCommandName]: () => CVoiceControl.stop(),
            [pauseCommandName]: () => CVoiceControl.pause(),
            [scrollDownName]: () => window.scroll(0, window.scrollY + 400),
            [scrollUpName]: () => window.scroll(0, window.scrollY - 400),
            ...navigationCommands,
        };
    }

    static getCommandsNames(data){
        const commands = this.getCommands(data);
        return Object.keys(commands).map(key => key);
    }
}

export default CAppVoiceControl;