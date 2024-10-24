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
import {exportTemplate, getTemplateByConnectionId} from "../redux_toolkit/action_creators/TemplateCreators";

const templateMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if(exportTemplate.fulfilled.type === action.type){
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(action.payload.templateContent));
        let downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", action.payload.id + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
    if(getTemplateByConnectionId.fulfilled.type === action.type){
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(action.payload));
        let downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", action.payload.templateId + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
    return next(action);
}

export default templateMiddleware;
