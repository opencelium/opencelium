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
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import { Row, Col } from "react-grid-system";

import styles from '../../../themes/default/content/my_profile/my_profile.scss';
import UserPhotoIcon from "../../icons/UserPhotoIcon";
import {getThemeClass} from "../../../utils/app";
import FontIcon from "../../general/basic_components/FontIcon";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
          authUser: auth.get('authUser'),
    };
}


/**
 * Avatar Area information for MyProfile
 */
@connect(mapStateToProps, {})
@withTranslation('users')
class AvatarArea extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {user, grid, t, authUser} = this.props;
        let classNames = ['user_details_email', 'user_details_avatar', 'user_details_last_login', 'user_details_actions', 'user_details_action',
        'user_details_email_xs', 'user_details_avatar_xs', 'user_details_last_login_xs', 'user_details_actions_xs', 'user_details_action_xs',
        'user_details_avatar_area', 'user_details_avatar_size'];
        classNames = getThemeClass({classNames, authUser, styles});
        const userDetail = user.userDetail;
        let emailStyle = styles[classNames.user_details_email];
        let avatarStyle = styles[classNames.user_details_avatar];
        let lastLoginStyle = styles[classNames.user_details_last_login];
        let actionsStyle = styles[classNames.user_details_actions];
        let actionStyle = styles[classNames.user_details_action];
        if(grid === 'xs'){
            emailStyle = styles[classNames.user_details_email_xs];
            avatarStyle = styles[classNames.user_details_avatar_xs];
            lastLoginStyle = styles[classNames.user_details_last_login_xs];
            actionsStyle = styles[classNames.user_details_actions_xs];
            actionStyle = styles[classNames.user_details_action_xs];
        }

        const actions = (
            <div className={actionsStyle}>
                <span className={actionStyle}><FontIcon value={'settings_input_hdmi'}/><span>Connector</span></span>
                <span className={actionStyle}><FontIcon value={'settings_input_composite'}/><span>Connection</span></span>
                <span className={actionStyle}><FontIcon value={'access_time'}/><span>Event</span></span>
            </div>
        );
        let requestTime = userDetail.requestTime ? new Date(Date.parse(userDetail.requestTime)) : '-';
        if(requestTime !== '-'){
            requestTime = requestTime.toLocaleString();
        }
        return (
            <Col xs={12} sm={6} md={6}>
                <Row className={styles[classNames.user_details_avatar_area]}>
                    {
                        //actions
                    }
                    <div className={avatarStyle}>
                        <UserPhotoIcon photo={userDetail.profilePicture} className={styles[classNames.user_details_avatar_size]}/>
                    </div>
                    <div className={emailStyle}><a href={`mailto:${user.email}`}>{user.email}</a></div>
                    <div className={lastLoginStyle}>
                        <div>{t("VIEW.LAST_LOGIN")}: {requestTime}</div>
                    </div>
                </Row>
            </Col>
        );
    }
}

AvatarArea.propTypes = {
    user: PropTypes.object.isRequired,
    grid: PropTypes.string,
};

AvatarArea.defaultProps = {
    grid: '',
};


export default AvatarArea;