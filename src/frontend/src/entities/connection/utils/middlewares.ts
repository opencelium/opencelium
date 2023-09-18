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

import { Middleware } from 'redux'
import {RootState} from "@application/utils/store";
import {setAnimationPaused} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import AdditionalFunctions
    from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/classes/AdditionalFunctions";

export const connectionMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if (setAnimationPaused.type === action.type) {
        if(!action.payload){
            if(AdditionalFunctions.pauseTimeout){
                clearInterval(AdditionalFunctions.pauseTimeout);
                AdditionalFunctions.pauseTimeout = null;
                if(AdditionalFunctions.pauseFunction){
                    AdditionalFunctions.pauseFunction('resolving');
                }
            }
        }
    }
    return next(action);
}
