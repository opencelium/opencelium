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
import {requestRemoteApi} from "@action/application/ApplicationCreators";
import {useAppDispatch} from "../../../hooks/redux";
import {Application} from "@class/application/Application";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import ContentLoading from "@molecule/loading/ContentLoading";
import {Text} from "@atom/text/Text";
import { REQUEST_METHOD } from "@model/invoker/Request";

const MonitoringBoardsWidget: FC =
    ({

    }) => {
    const dispatch = useAppDispatch();
    const {requestingRemoteApi, remoteApiData} = Application.getReduxState();
    const {authUser} = Auth.getReduxState();
    let defaultUrl = `${protocol}//${hostname}:19999/oc-mode.html`;
    if(authUser.hasOwnProperty('dashboard')){
        if(authUser.dashboard.hasOwnProperty('settings')
            && authUser.dashboard.settings.url !== ''){
            defaultUrl = authUser.dashboard.settings.url;
        }
    }
    useEffect(() => {
        dispatch(requestRemoteApi({url: defaultUrl, method: REQUEST_METHOD.GET, body: null, header: {}}));
    }, [])
    if(requestingRemoteApi !== API_REQUEST_STATE.FINISH && requestingRemoteApi !== API_REQUEST_STATE.ERROR){
        return <ContentLoading/>;
    }
    return (
        <MonitoringBoardsWidgetStyled >
            <WidgetTitle title={'Monitoring'}/>
            {remoteApiData?.statusCodeValue !== 200 ?
                <Text value={"Feature not installed"}/>
                :
                <Iframe
                    onLoad={() => {
                        console.log('loaded')
                    }}
                    url={defaultUrl}
                    width="100%"
                    height="50%"
                    id="monitoringIframe"
                    display="block"
                    position="relative"
                    allowFullScreen
                    // @ts-ignore
                    sandbox={`allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation`}
                />
            }
        </MonitoringBoardsWidgetStyled>
    )
}

MonitoringBoardsWidget.defaultProps = {
}


export {
    MonitoringBoardsWidget,
};
