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
import { Row, Col } from "react-grid-system";

import {updateTheme} from '@actions/auth';
import styles from '@themes/default/content/my_profile/my_profile.scss';
import SubHeader from "../../general/view_component/SubHeader";
import {getThemeClass} from "@utils/app";
import {withTranslation} from "react-i18next";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CMyProfileControl from "@classes/voice_control/CMyProfileControl";

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
    };
}


/**
 * Themes area of MyProfile
 */
@connect(mapStateToProps, {updateTheme})
@withTranslation('my_profile')
class Themes extends Component{

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
        const {authUser, t} = this.props;
        let classNames = ['user_details_themes_title', 'user_details_themes'];
        classNames = getThemeClass({classNames, authUser, styles});
        let theme = 'default';
        if(authUser.userDetail.hasOwnProperty('theme') && authUser.userDetail.theme){
            theme = authUser.userDetail.theme;
        }
        return (
            <Row>
                <Col md={12}>
                    <SubHeader title={'Theme'} authUser={authUser} className={styles[classNames.user_details_themes_title]}/>
                    <Row className={styles[classNames.user_details_themes]}>
                        <Col md={12}>
                            <RadioButtons
                                label={''}
                                value={theme}
                                handleChange={::this.handleChangeTheme}
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
                        </Col>
                    </Row>
                </Col>
            </Row>
        );
    }
}


export default Themes;