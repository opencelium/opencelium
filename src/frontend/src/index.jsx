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
import './scripts/config';
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
import SocketDevTools from "./socket/dev-tools/SocketDevTools";
import LogsPanel from "@app_component/connection_logs/LogsPanel";
import {SocketDataProvider} from "./socket/SocketDataContext";
import {SocketProvider} from "./socket/SocketContext";

ReactDOM.render(
    <Provider store={store}>
        <SocketProvider>
            <SocketDataProvider>
                <SocketDevTools/>
                <hr style={{marginTop: 20, marginBottom: 20}}/>
                <LogsPanel/>
            </SocketDataProvider>
        </SocketProvider>
        {/*<App/>*/}
    </Provider>,
    document.getElementById("root"));


