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

import { Middleware } from 'redux'
import {RootState} from "@store/store";
import {LocalStorage} from "@class/../classes/application/LocalStorage";
import {getVersion} from "@action/application/ApplicationCreators";
import {ApplicationVersionResponseProps} from "@requestInterface/application/IApplication";
import { setConnectionViewType, setGridViewType, setViewType } from '@store/reducers/application/ApplicationSlice';
import {exportTemplate} from "@action/connection/TemplateCreators";

export const applicationMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if(getVersion.fulfilled.type === action.type){
        const versionResponse: ApplicationVersionResponseProps = action.payload;
        const storage = LocalStorage.getStorage();
        storage.set('appVersion', versionResponse.version);
    }
    if(setConnectionViewType.type === action.type){
        const storage = LocalStorage.getStorage();
        storage.set('connectionViewType', action.payload);
    }
    if(setViewType.type === action.type){
        const storage = LocalStorage.getStorage();
        storage.set('viewType', action.payload);
    }
    if(setGridViewType.type === action.type){
        const storage = LocalStorage.getStorage();
        storage.set('gridViewType', action.payload);
    }
    if(exportTemplate.fulfilled.type === action.type){
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(action.payload.templateContent));
        let downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", action.payload.id + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
    return next(action);
}
