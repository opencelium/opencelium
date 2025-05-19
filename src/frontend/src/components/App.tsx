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

import React, {FC, Suspense, useEffect, useState} from 'react';
import {BrowserRouter} from "react-router-dom";
import {ThemeProvider, withTheme} from 'styled-components';
import {getRoutes} from "@application/utils/routes";
import {Application} from "@application/classes/Application";
import {
    offlineServiceOpenCeliumUrls,
    onlineServiceOpenCeliumUrl, Urls
} from '@entity/application/requests/classes/url';
import {bindWithServicePortalThemes} from "@entity/application/utils/utils";
import Themes, {DefaultTheme, updateThemeWithColors} from "@style/Theme";
import {Global} from "@style/global";
import {Auth} from "@application/classes/Auth";
import {useAppDispatch} from "@application/utils/store";
import {LocalStorage} from "@application/classes/LocalStorage";
import {getLogoName} from "@application/redux_toolkit/action_creators/ApplicationCreators";
import {isArray} from "@application/utils/utils";
import {Loading} from "@app_component/base/loading/Loading";
import {SocketProvider} from "../socket/SocketContext";
import {SocketDataProvider} from "../socket/SocketDataContext";


const App = ({}) => {
    const dispatch = useAppDispatch();
    const {isAuth, authUser} = Auth.getReduxState();
    const {themes} = Application.getReduxState();
    const [hasSettings, toggleHasSettings] = useState(false);
    let selectedTheme: any = themes && isArray(themes) ? themes.find(theme => theme.isCurrent) || DefaultTheme : DefaultTheme;
    const appTheme = updateThemeWithColors(Themes.default, selectedTheme);
    const setSettings = (settings: any) => {
        const apiPort = settings.PORT.API;
        const socketPort = settings.PORT.SOCKET;
        const kibanaPort = settings.PORT.KIBANA;
        let {protocol, hostname, port, pathname} = window.location;
        if(settings.hasOwnProperty('PROTOCOL') && settings.PROTOCOL !== '') protocol = settings.PROTOCOL;
        if(settings.hasOwnProperty('HOSTNAME') && settings.HOSTNAME !== '') hostname = settings.HOSTNAME;
        if(settings.PORT.hasOwnProperty('APPLICATION') && settings.PORT.APPLICATION !== 0) port = settings.PORT.APPLICATION;
        Urls.baseUrl = settings.hasOwnProperty('SERVER_ENDPOINT') && settings.SERVER_ENDPOINT !== '' ? `${protocol}//${hostname}${apiPort ? `:${apiPort}` : ""}${settings.SERVER_ENDPOINT}` : `${protocol}//${hostname}${apiPort ? `:${apiPort}` : ""}/`;
        Urls.baseUrlApi = settings.hasOwnProperty('SERVER_ENDPOINT') && settings.SERVER_ENDPOINT !== '' ? `${protocol}//${hostname}${apiPort ? `:${apiPort}` : ""}${settings.SERVER_ENDPOINT}` : `${protocol}//${hostname}${apiPort ? `:${apiPort}` : ""}/`;
        Urls.socketServer = `${protocol}//${hostname}:${socketPort}/`;
        Urls.kibanaUrl = `${protocol}//${hostname}:${kibanaPort}/app/kibana`;
        toggleHasSettings(true);
    }
    useEffect(() => {
        fetch("/settings.json")
            .then((response) => response.json())
            .then((data) => setSettings(data))
            .catch((error) => console.error("Error loading settings:", error));
    }, []);
    useEffect(() => {
        if(authUser) {
            //if (authUser.userDetail.themeSync) {
                if (navigator.onLine) {
                    bindWithServicePortalThemes(onlineServiceOpenCeliumUrl);
                } else {
                    bindWithServicePortalThemes(offlineServiceOpenCeliumUrls);
                }
            //} else {
                //unbindWithServicePortalThemes();
            //}
        }
    }, [authUser?.userDetail?.themeSync || authUser])
    useEffect(() => {
        if(isAuth) {
            if(authUser.themes) {
                const storage = LocalStorage.getStorage();
                if (storage.get('themes') !== authUser.themes) {
                    //dispatch(updateAuthUser({...authUser, themes: storage.get('themes')}));
                }
            }
            if(authUser.userDetail.sync){
                dispatch(getLogoName(authUser.email));
            }
        }
    },[isAuth])
    if (!hasSettings) {
        return <div style={{marginTop: 200}}><Loading/></div>
    }
    return (
        <SocketProvider>
            <SocketDataProvider>
                <ThemeProvider theme={appTheme}>
                    <BrowserRouter>
                        <Global/>
                        {getRoutes()}
                    </BrowserRouter>
                </ThemeProvider>
            </SocketDataProvider>
        </SocketProvider>
    )
}

App.defaultProps = {
}


export {
    App,
};

export default withTheme(App);
