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
import CNotification, {EVENT_TYPE} from "@classes/components/content/schedule/notification/CNotification";
import RadioButtons from "@basic_components/inputs/RadioButtons";


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

    getRadios(){
        const {t} = this.props;
        let radioButtons = [];
        for(let key in EVENT_TYPE){
            radioButtons.push({
                id: `input_event_${EVENT_TYPE[key]}`,
                onFocus: ::this.focusEventTypeRadio,
                onBlur: ::this.blurEventTypeRadio,
                label: `${t(`NOTIFICATION.EVENT_${key}`)}`,
                value: EVENT_TYPE[key],
            });
        }
        return radioButtons;
    }

    render(){
        const {t, notification} = this.props;
        const radios = ::this.getRadios();
        return(
            <RadioButtons
                label={t('NOTIFICATION.NOTIFICATION_CHANGE.EVENT_TYPE_LABEL')}
                value={notification.eventType}
                handleChange={::this.onChangeEventType}
                icon={'event'}
                radios={radios}
            />
        );
    }
}

EventTypeInput.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
    changeNotification: PropTypes.func.isRequired,
};

export default EventTypeInput;