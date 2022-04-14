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

import React, {FC, Suspense} from 'react';
import {ThemeProvider, withTheme} from 'styled-components';
import Themes, {ThemeNames} from "./general/Theme";
import {BrowserRouter} from "react-router-dom";
import {Global} from "../styles/global";
import {getRoutes} from "@store/routes";
import {Auth} from "@class/../classes/application/Auth";

import "../styles/css/bootstrap.css";

const App = ({}) => {
    const {authUser} = Auth.getReduxState();
    let theme: ThemeNames = authUser?.userDetail?.theme || null;
    let appTheme: any = theme ? Themes[theme] : Themes.default;
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