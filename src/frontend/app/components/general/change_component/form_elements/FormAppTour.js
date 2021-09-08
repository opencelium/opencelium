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

import {toggleAppTour} from '@actions/auth';
import {withTranslation} from "react-i18next";
import TooltipSwitch from "@basic_components/tooltips/TooltipSwitch";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CMyProfileControl from "@classes/voice_control/CMyProfileControl";
import ToolboxThemeInput from "@root/app/hocs/ToolboxThemeInput";
import {API_REQUEST_STATE} from "@utils/constants/app";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
        appTour: auth.get('authUser').userDetail.appTour,
        togglingAppTour: auth.get('togglingAppTour'),
    };
}


/**
 * AppTour area of MyProfile
 */
@connect(mapStateToProps, {toggleAppTour})
@withTranslation('my_profile')
class FormAppTour extends Component{

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
        const {toggleAppTour, authUser} = this.props;
        toggleAppTour(authUser);
        this.forceUpdate();
    }

    render(){
        const {authUser, t, data, togglingAppTour, appTour} = this.props;
        const {label, icon} = data;
        return (
            <ToolboxThemeInput label={label} icon={icon}>
                <TooltipSwitch
                    id={'app_tour'}
                    loadingIconStyles={{textAlign: 'left'}}
                    isLoading={togglingAppTour === API_REQUEST_STATE.START}
                    authUser={authUser}
                    tooltip={appTour ? t('APP_TOUR.DISABLE') : t('APP_TOUR.ENABLE')}
                    checked={appTour}
                    onChange={::this.handleChangeAppTour}
                    label={t('APP_TOUR.TITLE')}
                />
            </ToolboxThemeInput>
        );
    }
}


export default FormAppTour;