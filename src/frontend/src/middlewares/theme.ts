import { Middleware } from 'redux'
import {RootState, store} from "@store/store";
import {LocalStorage} from "@class/application/LocalStorage";
import {setTheme} from '@slice/application/ApplicationSlice';

window.addEventListener("message", handleMessage, false);
function handleMessage(e: any) {
    let {key, value, method} = e.data;
    if (method === 'opencelium_theme_store') {
        window.localStorage.setItem(key, value);
    } else if (method === 'opencelium_theme_retrieve') {
        let value = window.localStorage.getItem(key);
        e.source.postMessage({
            key,
            value,
            method: 'opencelium_theme_response'
        }, '*');
    }
}

window.addEventListener("message", handleResponse, false);
function handleResponse(e: any) {
    let {value,method} = e.data
    if (method === 'opencelium_theme_response') {
        if(store.getState().applicationReducer.theme !== value){
            store.dispatch(setTheme(value));
        }
    }
}

setInterval(() => {
    // @ts-ignore
    document.getElementById('iframe_messenger').contentWindow.postMessage({
        method: 'opencelium_theme_retrieve',
        key: 'key'
    }, '*');
}, 1000);

export const themeMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if (setTheme.match(action)) {
        const storage = LocalStorage.getStorage();
        if(storage.get('theme') !== action.payload){
            storage.set('theme', action.payload);
            // @ts-ignore
            document.getElementById('iframe_messenger').contentWindow.postMessage({
                key: 'key',
                value: action.payload,
                method: 'opencelium_theme_store'
            }, '*');
        }
    }
    return next(action);
}