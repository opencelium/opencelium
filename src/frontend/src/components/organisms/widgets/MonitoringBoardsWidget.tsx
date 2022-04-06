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

import React, {FC, useEffect, useState} from 'react';
import {MonitoringBoardsWidgetStyled} from './styles';
import Iframe from 'react-iframe';
import {hostname, protocol} from "@request/application/url";
import {Auth} from "@class/application/Auth";
import {WidgetTitle} from "@molecule/widget_title/WidgetTitle";

const MonitoringBoardsWidget: FC =
    ({

    }) => {
    const {authUser} = Auth.getReduxState();
    let defaultUrl = `${protocol}//${hostname}:19999/oc-mode.html`;
    if(authUser.hasOwnProperty('dashboard')){
        if(authUser.dashboard.hasOwnProperty('settings')
            && authUser.dashboard.settings.url !== ''){
            defaultUrl = authUser.dashboard.settings.url;
        }
    }
    const [url, setUrl] = useState<string>(defaultUrl);
    useEffect(() => {
        loadUrl();
    }, [])
    const loadUrl = () => {
        /*
        * TODO: implement update dashboard settings
        */
    }
        return (
        <MonitoringBoardsWidgetStyled >
            <WidgetTitle title={'Monitoring'}/>
            <Iframe
                url={url}
                width="100%"
                height="50%"
                id="monitoringIframe"
                display="block"
                position="relative"
                allowFullScreen
                // @ts-ignore
                sandbox={`allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation`}
            />
        </MonitoringBoardsWidgetStyled>
    )
}

MonitoringBoardsWidget.defaultProps = {
}


export {
    MonitoringBoardsWidget,
};
