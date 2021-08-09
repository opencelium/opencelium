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

import {fetchNotificationTemplate} from '@actions/notification_templates/fetch';
import {updateNotificationTemplate} from '@actions/notification_templates/update';
import {NotificationTemplatePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {SingleComponent} from "@decorators/SingleComponent";
import {NotificationTemplateChange} from "@components/content/notification_templates/NotificationTemplateChange";

function mapStateToProps(state){
    const auth = state.get('auth');
    const notificationTemplates = state.get('notificationTemplates');
    return{
        authUser: auth.get('authUser'),
        fetchingNotificationTemplate: notificationTemplates.get('fetchingNotificationTemplate'),
        updatingNotificationTemplate: notificationTemplates.get('updatingNotificationTemplate'),
        notificationTemplate: notificationTemplates.get('notificationTemplate'),
        error: notificationTemplates.get('error'),
    };
}

function mapNotificationTemplate(notificationTemplate){
    return notificationTemplate.getObject();
}

/**
 * Component to Update Notification Template
 */
@connect(mapStateToProps, {fetchNotificationTemplate, updateNotificationTemplate})
@permission(NotificationTemplatePermissions.UPDATE, true)
@withTranslation(['notification_templates', 'app', 'schedules'])
@SingleComponent('notificationTemplate', 'updating', [], mapNotificationTemplate)
@NotificationTemplateChange('update')
class NotificationTemplateUpdate extends Component{}

export default NotificationTemplateUpdate;