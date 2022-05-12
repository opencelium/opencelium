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

import React, {Component} from 'react';
import {connect} from 'react-redux';

import {updateTheme} from '@actions/auth';
import {withTranslation} from "react-i18next";
import RadioButtons from "@entity/connection/components/components/general/basic_components/inputs/RadioButtons";
import CVoiceControl from "@entity/connection/components/classes/voice_control/CVoiceControl";
import CMyProfileControl from "@entity/connection/components/classes/voice_control/CMyProfileControl";

function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    return{
        authUser,
    };
}


/**
 * Themes area of MyProfile
 */
@connect(mapStateToProps, {updateTheme})
@withTranslation('my_profile')
class FormThemes extends Component{

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
    handleChangeTheme(theme){
        let authUser = Object.assign({}, this.props.authUser);
        authUser.theme = theme;
        this.props.updateTheme(authUser);
    }

    render(){
        const {authUser, t, data} = this.props;
        const {label, icon} = data;
        let theme = 'default';
        if(authUser.userDetail.hasOwnProperty('theme') && authUser.userDetail.theme){
            theme = authUser.userDetail.theme;
        }
        return (
            <RadioButtons
                value={theme}
                label={label}
                icon={icon}
                handleChange={(a) => this.handleChangeTheme(a)}
                radios={[
                    {
                        id: `theme_default`,
                        label: `${t('THEME.DEFAULT')}`,
                        value: 'default',
                    },{
                        id: `theme_other`,
                        label: `${t('THEME.OTHER')}`,
                        value: 'other',
                    }
                ]}
            />
        );
    }
}


export default FormThemes;