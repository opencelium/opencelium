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

import React, {FC, Suspense, useEffect} from 'react';
import {BrowserRouter} from "react-router-dom";
import {ThemeProvider, withTheme} from 'styled-components';
import {getRoutes} from "@application/utils/routes";
import {Application} from "@application/classes/Application";
import {store} from "@application/utils/store";
import {setTheme} from "@application/redux_toolkit/slices/ApplicationSlice";
import {offlineServiceOpenCeliumUrls, onlineServiceOpenCeliumUrl} from '@application/requests/classes/url';
import Themes, {ThemeNames} from "@style/Theme";
import {Global} from "@style/global";

/**
 * to create iframe for cross domain messaging
 *
 * @param src - iframe url
 */
export function createIframe(src: string): void{
    const iframe: any = document.getElementById('iframe');
    if(iframe) {
        iframe.src = src;
    }
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
            iframe.contentWindow.postMessage({
                method: 'opencelium_theme_retrieve',
                key: 'key'
            }, '*');
        }
    }, 1000);
}

const App = ({}) => {
    const {theme} = Application.getReduxState();
    let appTheme: any = theme ? Themes[theme] : Themes.default;
    useEffect(() => {
        if(navigator.onLine){
            createIframe(onlineServiceOpenCeliumUrl);
        } else{
            createIframe(offlineServiceOpenCeliumUrls);
        }
    }, [])
    return (
        <ThemeProvider theme={appTheme}>
            <BrowserRouter>
                <Global/>
                {getRoutes()}
            </BrowserRouter>
        </ThemeProvider>
    )
}

App.defaultProps = {
}


export {
    App,
};

export default withTheme(App);
