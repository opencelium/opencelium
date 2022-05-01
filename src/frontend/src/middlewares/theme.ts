import { Middleware } from 'redux'
import {RootState, store} from "@store/store";
import {LocalStorage} from "@class/application/LocalStorage";
import {setTheme} from '@slice/application/ApplicationSlice';

export const themeMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if (setTheme.match(action)) {
        const storage = LocalStorage.getStorage();
        if(storage.get('theme') !== action.payload){
            storage.set('theme', action.payload);
            const iframe = document.getElementById('iframe_messenger');
            if(iframe) {
                // @ts-ignore
                iframe.contentWindow.postMessage({
                    key: 'key',
                    value: action.payload,
                    method: 'opencelium_theme_store'
                }, '*');
            }
        }
    }
    return next(action);
}