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

import React, {Component} from 'react';
import {connect} from "react-redux";
import {withTranslation} from 'react-i18next';
import MonitoringBoards from "./MonitoringBoards";
import Content from "../../../general/content/Content";
import styles from '@themes/default/content/dashboard/dashboard.scss';
import {getThemeClass} from "@utils/app";
import {fetchAppVersion} from "@actions/app";
import {API_REQUEST_STATE} from "@utils/constants/app";


function mapStateToProps(state){
    const app = state.get('app');
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
        fetchingAppVersion: app.get('fetchingAppVersion'),
    };
}

/**
 * Dashboard component
 */
@connect(mapStateToProps, {fetchAppVersion})
@withTranslation('dashboard')
class DashboardView extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount() {
        const {fetchingAppVersion, fetchAppVersion} = this.props;
        if(fetchingAppVersion !== API_REQUEST_STATE.START) {
            fetchAppVersion({showNotification: true});
        }
    }

    render(){
        const {t, authUser} = this.props;
        let classNames = ['monitoring'];
        classNames = getThemeClass({classNames, authUser, styles});
        let contentTranslations = {};
        contentTranslations.header = `${t('HEADER')}`;
        let getListLink = ``;
        return (
            <Content contentColClass={styles[classNames.monitoring]} translations={contentTranslations} getListLink={getListLink} permissions={{}} authUser={authUser}>
                <MonitoringBoards/>
            </Content>
        );
    }
}


export default DashboardView;