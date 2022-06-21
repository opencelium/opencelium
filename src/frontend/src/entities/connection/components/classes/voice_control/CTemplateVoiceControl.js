 /*
 *  Copyright (C) <2022>  <becon GmbH>
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
import CCommonControl from "@entity/connection/components/classes/voice_control/CCommonControl";

class CTemplateVoiceControl extends CCommonControl{

    static getCommands(data) {
        let navigationCommands = {};
        if (data && data.component) {
            if(typeof data.component.convert === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} convert ${data.component.props.data.template.name} template`] = () => data.component.convert();
            }
            if(typeof data.component.exportTemplate === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} download ${data.component.props.template.name} template`] = () => data.component.exportTemplate(null, data.component.props.template);
            }
            if(typeof data.component.convertAll === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} convert all templates`] = () => data.component.convertAll();
            }
            if(typeof data.component.toggleImport === 'function'){
                navigationCommands[`${PREFIX_COMMAND_NAME} import template`] = () => data.component.toggleImport();
                navigationCommands[`${PREFIX_COMMAND_NAME} cancel import (template)`] = () => data.component.toggleImport();
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

export default CTemplateVoiceControl;