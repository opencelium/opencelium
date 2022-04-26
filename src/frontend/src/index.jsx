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

import ReactDOM from 'react-dom';
import React from 'react';
import {Provider} from "react-redux";
import {store} from "@store/store";
import './translations/i18n';
import {App} from "./components/App";

import "@style/bootstrap.css";
import "@style/react_grid_layout.css";
import "@style/react_crop.css";


ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById("root"));