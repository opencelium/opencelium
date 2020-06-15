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
import {RadioButton, RadioGroup} from "react-toolbox/lib/radio";
import FontIcon from "@basic_components/FontIcon";
import CNotification, {EVENT_TYPE} from "@classes/components/content/schedule/notification/CNotification";
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
 * Event Type Input for Notification Change Component
 */
@connect(mapStateToProps, {})
@withTranslation('schedules')
class EventTypeInput extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
        };
    }

    /**
     * to focus on radio button
     */
    focusEventTypeRadio(){
        this.setState({focused: true});
    }

    /**
     * to blur from radio button
     */
    blurEventTypeRadio(){
        this.setState({focused: false});
    }

    /**
     * to change event type radio
     */
    onChangeEventType(eventType){
        let {notification} = this.props;
        const {changeNotification} = this.props;
        notification.eventType = eventType;
        changeNotification(notification);
    }

    renderRadioButtons(){
        const {t, authUser} = this.props;
        let classNames = [
            'radio_button',
            'radio_text',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        let radioButtons = [];
        for(let key in EVENT_TYPE){
            radioButtons.push(
                <RadioButton
                    key={key}
                    id={`input_event_${EVENT_TYPE[key]}`}
                    onFocus={::this.focusEventTypeRadio}
                    onBlur={::this.blurEventTypeRadio}
                    label={`${t(`NOTIFICATION.EVENT_${key}`)}`}
                    value={EVENT_TYPE[key]}
                    className={`${styles[classNames.radio_button]}`}
                    theme={{text: styles[classNames.radio_text]}}/>
            );
        }
        return radioButtons;
    }

    render(){
        const {focused} = this.state;
        const {t, authUser, notification} = this.props;
        let classNames = [
            'notification_change_event_type',
            'label',
            'radio_group',
            'first_radio_button',
            'notification_select_focused',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return(
            <div className={`${theme.withIcon} ${theme.input} ${styles[classNames.notification_change_event_type]}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles[classNames.label]}`}/>
                <RadioGroup name='theme' value={notification.eventType} onChange={::this.onChangeEventType} className={`${styles[classNames.radio_group]}`}>
                    {this.renderRadioButtons()}
                </RadioGroup>
                <FontIcon value={'event'} className={`${theme.icon} ${focused ? styles[classNames.notification_select_focused] : ''}`}/>
                <span className={theme.bar}/>
                <label className={`${theme.label} ${focused ? styles[classNames.notification_select_focused] : ''}`}>
                    {t('NOTIFICATION.NOTIFICATION_CHANGE.EVENT_TYPE_LABEL')}
                    <span className={theme.required}> *</span>
                </label>
            </div>
        );
    }
}

EventTypeInput.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
    changeNotification: PropTypes.func.isRequired,
};

export default EventTypeInput;