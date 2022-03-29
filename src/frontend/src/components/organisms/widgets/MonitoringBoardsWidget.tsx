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
                sandbox={`allow-same-origin`}
            />
        </MonitoringBoardsWidgetStyled>
    )
}

MonitoringBoardsWidget.defaultProps = {
}


export {
    MonitoringBoardsWidget,
};
