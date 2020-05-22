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
import CNotification, {NOTIFICATION_TYPE} from "../../../../../../classes/components/content/schedule/notification/CNotification";
import RecipientsInput from "./RecipientsInput";
import SlackChannelInput from "./SlackChannelInput";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Name Input for Notification Change Component
 */
@connect(mapStateToProps, {})
class TargetGroupInput extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {notification, changeNotification} = this.props;
        switch(notification.notificationType){
            case NOTIFICATION_TYPE.EMAIL:
                return (
                    <RecipientsInput
                        notification={notification}
                        changeNotification={changeNotification}
                    />
                );
            case NOTIFICATION_TYPE.SLACK:
                return (
                    <SlackChannelInput
                        notification={notification}
                        changeNotification={changeNotification}
                    />
                );
        }
        return null;
    }
}

TargetGroupInput.propTypes = {
    notification: PropTypes.instanceOf(CNotification).isRequired,
    changeNotification: PropTypes.func.isRequired,
};

export default TargetGroupInput;