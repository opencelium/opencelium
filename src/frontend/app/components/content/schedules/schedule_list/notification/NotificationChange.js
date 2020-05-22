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
import {withTranslation} from "react-i18next";
import {permission} from "../../../../../decorators/permission";
import {SchedulePermissions} from "../../../../../utils/constants/permissions";
import CNotification from "../../../../../classes/components/content/schedule/notification/CNotification";
import EventTypeInput from "./inputs/EventTypeInput";
import NotificationTypeInput from "./inputs/NotificationTypeInput";
import TemplateInput from "./inputs/TemplateInput";
import {setFocusById} from "../../../../../utils/app";
import NameInput from "./inputs/NameInput";
import TargetGroupInput from "./inputs/TargetGroupInput";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Component to add or to update Notification
 */
@connect(mapStateToProps, {})
@permission(SchedulePermissions.UPDATE, false)
@withTranslation('schedules')
class NotificationChange extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        setFocusById('input_notification_name');
    }

    render(){
        const {notification, changeNotification} = this.props;
        return (
            <div>
                <NameInput notification={notification} changeNotification={changeNotification}/>
                <EventTypeInput notification={notification} changeNotification={changeNotification}/>
                <NotificationTypeInput notification={notification} changeNotification={changeNotification}/>
                <TemplateInput notification={notification} changeNotification={changeNotification}/>
                <TargetGroupInput notification={notification} changeNotification={changeNotification}/>
            </div>
        );
    }
}

NotificationChange.propTypes = {
    changeNotification: PropTypes.func.isRequired,
    notification: PropTypes.instanceOf(CNotification).isRequired,
};

export default NotificationChange;