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
