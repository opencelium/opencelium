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
import {createIframe} from "@entity/application/utils/utils";
import Themes, {ThemeNames} from "@style/Theme";
import {Global} from "@style/global";


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
