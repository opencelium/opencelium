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
import {connect} from 'react-redux';
import { Row, Col } from "react-grid-system";

import {toggleAppTour} from '@actions/auth';
import styles from '@themes/default/content/my_profile/my_profile.scss';
import SubHeader from "../../general/view_component/SubHeader";
import {withTranslation} from "react-i18next";
import {getThemeClass} from "@utils/app";
import TooltipSwitch from "@basic_components/tooltips/TooltipSwitch";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CMyProfileControl from "@classes/voice_control/CMyProfileControl";

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
    };
}


/**
 * AppTour area of MyProfile
 */
@connect(mapStateToProps, {toggleAppTour})
@withTranslation('my_profile')
class AppTour extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        CVoiceControl.initCommands({component:this}, CMyProfileControl);
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component:this}, CMyProfileControl);
    }

    /**
     * to update theme of auth user
     */
    handleChangeAppTour(){
        const {toggleAppTour} = this.props;
        let {authUser} = this.props;
        let appTour = true;
        if(authUser.userDetail.hasOwnProperty('appTour')){
            appTour = authUser.userDetail.appTour;
        }
        authUser.userDetail.appTour = !appTour;
        toggleAppTour(authUser);
        this.forceUpdate();
    }

    render(){
        const {authUser, t} = this.props;
        let appTour = true;
        if(authUser.userDetail.hasOwnProperty('appTour')){
            appTour = authUser.userDetail.appTour;
        }
        let classNames = ['user_details_app_tour_header', 'user_details_app_tour_title', 'user_details_app_tour'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <Row>
                <Col md={12}>
                    <SubHeader title={'Application Tour'} authUser={authUser} className={styles[classNames.user_details_app_tour_header]}/>
                    <Row className={styles[classNames.user_details_app_tour]}>
                        <Col md={12}>
                            <TooltipSwitch
                                id={'app_tour'}
                                authUser={authUser}
                                tooltip={appTour ? t('APP_TOUR.DISABLE') : t('APP_TOUR.ENABLE')}
                                checked={appTour}
                                onChange={::this.handleChangeAppTour}
                                label={t('APP_TOUR.TITLE')}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>
        );
    }
}


export default AppTour;