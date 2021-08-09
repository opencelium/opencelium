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
import {withTranslation} from 'react-i18next';

import {addNotificationTemplate} from '@actions/notification_templates/add';
import {NotificationTemplatePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {SingleComponent} from "@decorators/SingleComponent";
import {NotificationTemplateChange} from "@components/content/notification_templates/NotificationTemplateChange";


function mapStateToProps(state){
    const auth = state.get('auth');
    const notificationTemplates = state.get('notificationTemplates');
    return{
        authUser: auth.get('authUser'),
        addingNotificationTemplate: notificationTemplates.get('addingNotificationTemplate'),
        error: notificationTemplates.get('error'),
    };
}

function mapNotificationTemplate(notificationTemplate){
    return notificationTemplate.getObject();
}

/**
 * Component to Add Notification Template
 */
@connect(mapStateToProps, {addNotificationTemplate})
@permission(NotificationTemplatePermissions.CREATE, true)
@withTranslation(['notification_templates', 'app', 'schedules'])
@SingleComponent('notificationTemplate', 'adding', [], mapNotificationTemplate)
@NotificationTemplateChange('add')
class NotificationTemplateAdd extends Component{}

export default NotificationTemplateAdd;