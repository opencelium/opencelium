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

import React, { Component }  from 'react';
import {connect} from 'react-redux';
import {deleteNotificationTemplate} from "@actions/notification_templates/delete";
import LayoutComponent from "@decorators/LayoutComponent";


/**
 * Layout for Notification Templates
 */
@connect(null, {deleteNotificationTemplate})
@LayoutComponent('template', 'templates', 'notification_templates')
class NotificationTemplateLayout extends Component{

    render(){
        return null;
    }
}

export default NotificationTemplateLayout;
