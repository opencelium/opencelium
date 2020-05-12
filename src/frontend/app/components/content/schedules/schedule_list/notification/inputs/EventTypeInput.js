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
import styles from '../../../../../../themes/default/content/schedules/schedules.scss';
import {getThemeClass} from "../../../../../../utils/app";
import theme from "react-toolbox/lib/input/theme.css";
import {RadioButton, RadioGroup} from "react-toolbox/lib/radio";
import FontIcon from "../../../../../general/basic_components/FontIcon";
import CNotification from "../../../../../../classes/components/content/schedule/CNotification";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Event Type Input for Notification Change Component
 */
@connect(mapStateToProps, {})
@withTranslation('schedules')
class EventTypeInput extends Component{

    constructor(props){
        super(props);
    }

    onChangeEventType(eventType){
        let {notification} = this.props;
        const {changeNotification} = this.props;
        notification.eventType = eventType;
        changeNotification(notification);
    }

    render(){
        const {t, authUser, notification} = this.props;
        let classNames = [
            'notification_change_event_type',
            'label',
            'radio_group',
            'radio_button',
            'first_radio_button',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return(
            <div className={`${theme.withIcon} ${theme.input} ${styles[classNames.notification_change_event_type]}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles[classNames.label]}`}/>
                <RadioGroup name='theme' value={notification.eventType} onChange={::this.onChangeEventType} className={`${styles[classNames.radio_group]}`}>
                    <RadioButton id='input_event_pre' label={`${t('NOTIFICATION.EVENT_PRE')}`} value='pre' className={`${styles[classNames.radio_button]} ${styles[classNames.first_radio_button]}`}/>
                    <RadioButton id='input_event_post' label={`${t('NOTIFICATION.EVENT_POST')}`} value='post' className={`${styles[classNames.radio_button]}`}/>
                </RadioGroup>
                <FontIcon value={'event'} className={theme.icon}/>
                <span className={theme.bar}/>
                <label className={theme.label}>{'Event'}</label>
            </div>
        );
    }
}

EventTypeInput.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
};

export default EventTypeInput;