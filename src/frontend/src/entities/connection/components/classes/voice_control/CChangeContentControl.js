/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {PREFIX_COMMAND_NAME} from "@entity/connection/components/classes/voice_control/CVoiceControl";

class CChangeContentControl{

    static getCommands(data) {
        let navigationCommands = {};
        if (data && data.component && data.component.props.navigationPage) {
            if(typeof data.component.props.navigationPage.nextPage === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} next step`] = () => data.component.props.navigationPage.nextPage();
            }
            if(typeof data.component.props.navigationPage.prevPage === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} previous step`] = () => data.component.props.navigationPage.prevPage();
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

export default CChangeContentControl;