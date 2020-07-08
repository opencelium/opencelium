/*
 * Copyright (C) <2020>  <becon GmbH>
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

import {hot} from 'react-hot-loader/root';
import React from 'react';
import ReactDOM from 'react-dom';
import App from '@components/App';
import Favicon from "react-favicon";
import {hasHMR} from "@utils/constants/app";

const HotApp = hot(App);

const getApp = () => {
    return hasHMR ? <HotApp/> : <App/>;
};
/**
 * root enter of the app
 */
const renderApp = () =>
    ReactDOM.render(
        <React.Fragment>
            <Favicon url="../fav_icon.png" />
            {getApp()}
        </React.Fragment>, document.getElementById('app')
    );

if (hasHMR && module.hot) {
    module.hot.accept('@components/App', renderApp)
}

renderApp();