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

import {PREFIX_COMMAND_NAME} from "@entity/connection/components/classes/voice_control/CVoiceControl";

class CPaginationControl{

    static getCommands(data) {
        let navigationCommands = {};
        if (data && data.component) {
            if(typeof data.component.openNextPage === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} next page`] = () => data.component.openNextPage();
            }
            if(typeof data.component.openPrevPage === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} previous page`] = () => data.component.openPrevPage();
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

export default CPaginationControl;