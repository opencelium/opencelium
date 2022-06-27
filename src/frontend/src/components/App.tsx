/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {FC, Suspense, useEffect} from 'react';
import {BrowserRouter} from "react-router-dom";
import {ThemeProvider, withTheme} from 'styled-components';
import {getRoutes} from "@application/utils/routes";
import {Application} from "@application/classes/Application";
import {offlineServiceOpenCeliumUrls, onlineServiceOpenCeliumUrl} from '@entity/application/requests/classes/url';
import {createIframe, removeIframe} from "@entity/application/utils/utils";
import Themes, {DefaultTheme, updateThemeWithColors} from "@style/Theme";
import {Global} from "@style/global";
import {Auth} from "@application/classes/Auth";
import {useAppDispatch} from "@application/utils/store";
import { setThemes } from '@application/redux_toolkit/slices/ApplicationSlice';
import {LocalStorage} from "@application/classes/LocalStorage";
import {getLogoName} from "@application/redux_toolkit/action_creators/ApplicationCreators";


const App = ({}) => {
    const dispatch = useAppDispatch();
    const {isAuth, authUser} = Auth.getReduxState();
    const {themes} = Application.getReduxState();
    let selectedTheme: any = themes.find(theme => theme.isCurrent) || DefaultTheme;
    const appTheme = updateThemeWithColors(Themes.default, selectedTheme);
    useEffect(() => {
        if(authUser.userDetail.themeSync) {
            if (navigator.onLine) {
                createIframe(onlineServiceOpenCeliumUrl);
            } else {
                createIframe(offlineServiceOpenCeliumUrls);
            }
        } else{
            removeIframe();
        }
    }, [authUser.userDetail.themeSync])
    useEffect(() => {
        if(isAuth) {
            if(authUser.themes) {
                const storage = LocalStorage.getStorage();
                if (storage.get('themes') !== authUser.themes) {
                    dispatch(setThemes(authUser.themes));
                }
            }
            if(authUser.userDetail.sync){
                dispatch(getLogoName(authUser.email));
            }
        }
    },[isAuth])
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
