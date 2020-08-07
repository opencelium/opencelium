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
import PropTypes from "prop-types";
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import FontIcon from "@basic_components/FontIcon";
import CNotification from "@classes/components/content/schedule/notification/CNotification";
import OCSelect from "@basic_components/inputs/Select";
import {getThemeClass} from "@utils/app";

import theme from "react-toolbox/lib/input/theme.css";
import styles from '@themes/default/content/schedules/schedules.scss';


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Notification Type Input for Notification Change Component
 */
@connect(mapStateToProps, {})
@withTranslation('schedules')
class NotificationTypeInput extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
        };
    }

    /**
     * to focus on select
     */
    focusNotificationType(){
        this.setState({focused: true});
    }

    /**
     * to blur from select
     */
    blurNotificationType(){
        this.setState({focused: false});
    }

    /**
     * to change select
     */
    onChangeNotificationType(notificationType){
        let {notification} = this.props;
        const {changeNotification} = this.props;
        notification.setNotificationTypeFromSelect(notificationType);
        changeNotification(notification);
    }

    render(){
        const {focused} = this.state;
        const {authUser, t, notification} = this.props;
        const value = CNotification.getNotificationTypeForSelect(notification.notificationType, {translate: t});
        const options = CNotification.getAllNotificationTypesForSelect(t);
        let classNames = ['notification_select', 'notification_select_label', 'notification_select_focused'];
        classNames = getThemeClass({classNames, authUser, styles});
        return(
            <div className={`${theme.withIcon} ${theme.input}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles[classNames.notification_select_label]}`}/>
                <OCSelect
                    id={'input_notification_type'}
                    name={'input_notification_type'}
                    value={value}
                    onChange={::this.onChangeNotificationType}
                    onFocus={::this.focusNotificationType}
                    onBlur={::this.blurNotificationType}
                    options={options}
                    placeholder={t('NOTIFICATION.NOTIFICATION_CHANGE.NOTIFICATION_TYPE_PLACEHOLDER')}
                    className={`${styles[classNames.notification_select]}`}
                />
                <FontIcon value={'add_alert'} className={`${theme.icon} ${focused ? styles[classNames.notification_select_focused] : ''}`}/>
                <span className={theme.bar}/>
                <label className={`${theme.label} ${focused ? styles[classNames.notification_select_focused] : ''}`}>
                    {t('NOTIFICATION.NOTIFICATION_CHANGE.NOTIFICATION_TYPE_LABEL')}
                    <span className={theme.required}> *</span>
                </label>
            </div>
        );
    }
}

NotificationTypeInput.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
    changeNotification: PropTypes.func.isRequired,
};

export default NotificationTypeInput;