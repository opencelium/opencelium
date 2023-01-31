import {store} from "@application/utils/store";
import {setLogoDataStatus, setThemes} from "@application/redux_toolkit/slices/ApplicationSlice";
import {LocalStorage} from "@application/classes/LocalStorage";

/**
 * to create iframe for cross domain messaging
 *
 * @param src - iframe url
 */
export function bindWithServicePortalThemes(src: string): void{
    const iframe: any = document.createElement('iframe');
    iframe.id = 'iframe_messenger';
    iframe.style.display = 'none';
    iframe.src = src;
    document.body.appendChild(iframe);
    window.addEventListener("message", saveThemesHandler, false);
    setInterval(() => {
        getThemesFromServicePortal();
    }, 1000);
}


export const saveThemesHandler = (e: any) => {
    let {themes, method} = e.data;
    if (method === 'source.save_themes') {
        const localThemes = store.getState().applicationReducer.themes;
        if(themes && JSON.stringify(localThemes) !== themes){
            store.dispatch(setThemes(themes));
        }
    }
}

export const getThemesFromServicePortal = () => {
    const iframe = document.getElementById('iframe_messenger');
    const hasSync = store.getState().authReducer.authUser?.userDetail?.themeSync || false;
    //todo: uncomment when backend update user group will be ready
    if(iframe/* && hasSync*/){
        // @ts-ignore
        const contentWindow = iframe.contentWindow;
        contentWindow.postMessage({
            method: 'service_portal.get_themes',
        }, '*');
    }
}

export const saveThemesInServicePortal = (themes: string) => {
    const iframe = document.getElementById('iframe_messenger');
    const hasSync = store.getState().authReducer.authUser?.userDetail?.themeSync || false;
    //todo: uncomment when backend update user group will be ready
    if(iframe/* && hasSync*/){
        // @ts-ignore
        const contentWindow = iframe.contentWindow;
        contentWindow.postMessage({
            method: 'source.save_themes',
            themes,
        }, '*');
    }
}

export function unbindWithServicePortalThemes(){
    const iframe = document.getElementById('iframe_messenger');
    if(iframe){
        document.body.removeChild(iframe);
    }
}