import {store} from "@application/utils/store";
import {setTheme} from "@application/redux_toolkit/slices/ApplicationSlice";

/**
 * to create iframe for cross domain messaging
 *
 * @param src - iframe url
 */
export function createIframe(src: string): void{
    const iframe: any = document.createElement('iframe');
    iframe.id = 'iframe_messenger';
    iframe.style.display = 'none';
    iframe.src = src;
    document.body.appendChild(iframe);
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
    function handleResponse(e: any) {
        let {value,method} = e.data
        if (method === 'opencelium_theme_response') {
            if(store.getState().applicationReducer.theme !== value && value !== null){
                store.dispatch(setTheme(value));
            }
        }
    }
    window.addEventListener("message", handleMessage, false);
    window.addEventListener("message", handleResponse, false);
    setInterval(() => {
        const iframe = document.getElementById('iframe_messenger');
        if(iframe){
            // @ts-ignore
            const contentWindow = iframe.contentWindow;
            contentWindow.postMessage({
                method: 'opencelium_theme_retrieve',
                key: 'key'
            }, '*');
        }
    }, 1000);
}