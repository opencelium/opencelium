/*
 * Copyright (C) <2021>  <becon GmbH>
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

import React, {Component} from 'react';
import {connect} from 'react-redux';
import SubHeader from "../../../../general/view_component/SubHeader";
import Iframe from 'react-iframe';
import {updateDashboardSettings} from '@actions/auth';

import styles from '@themes/default/content/dashboard/dashboard.scss';
import {getThemeClass} from "@utils/app";
import {hostname, protocol} from '@utils/constants/url';


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
        error: auth.get('error'),
        updateDashboardSettings: auth.get('updateDashboardSettings'),
    };
}

/**
 * Component for monitoring using iframe
 */
@connect(mapStateToProps, {updateDashboardSettings})
class MonitoringBoardsWidget extends Component{

    constructor(props){
        super(props);
        let url = `${protocol}//${hostname}:19999/oc-mode.html`;
        if(props.authUser.hasOwnProperty('dashboard')){
            if(props.authUser.dashboard.hasOwnProperty('settings')
                && props.authUser.dashboard.settings.url !== ''){
                url = props.authUser.dashboard.settings.url;
            }
        }
        this.state = {
            url,
        };
    }

    componentDidMount(){
        this.loadUrl();
    }

    static getDerivedStateFromProps(props){
        if(props.authUser.hasOwnProperty('dashboard')){
            if(props.authUser.dashboard.hasOwnProperty('settings')){
                return{url :props.authUser.dashboard.settings.url};
            }
        }
        return null;
    }

    /**
     * to load url in iframe
     */
    loadUrl(){
        let {authUser, updateDashboardSettings} = this.props;

        if(!authUser.hasOwnProperty('dashboard')){
            authUser.dashboard = {settings: {url: this.state.url}};
        } else{
            if(!authUser.dashboard.hasOwnProperty('settings')) {
                authUser.dashboard.settings= {url: this.state.url};
            } else{
                authUser.dashboard.settings.url= this.state.url;
            }
        }
        updateDashboardSettings(authUser);
        this.forceUpdate();
    }
    
    render(){
        const {url} = this.state;
        const {authUser} = this.props;
        let classNames = ['monitoring_boards', 'navigation_button', 'navigation_button_title', 'wrong_iframe_url'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div className={styles[classNames.monitoring_boards]}>
                <SubHeader title={'Monitoring'} authUser={authUser}/>
                <Iframe
                    url={url}
                    width="100%"
                    height="50%"
                    id="monitoringIframe"
                    display="initial"
                    position="relative"
                    border="none"
                    allowFullScreen
                    sandbox={"allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation"}
                />
            </div>
        );
    }
}


export default MonitoringBoardsWidget;