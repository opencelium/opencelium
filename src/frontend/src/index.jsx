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

import ReactDOM from 'react-dom';
import React from 'react';
import {Provider} from "react-redux";
import "@style/fonts/fonts.css";
import "@style/css/bootstrap.css";
import "@style/css/graphiql.css";
import {store} from "@application/utils/store";
import '@application/utils/i18n';
import {App} from "@app_component/App";

import "@style/css/react_grid_layout.css";
import "@style/css/react_crop.css";

ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById("root"));