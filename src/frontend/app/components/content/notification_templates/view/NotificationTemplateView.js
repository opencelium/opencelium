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
import {NotificationTemplatePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {SingleComponent} from "@decorators/SingleComponent";
import ViewComponent from "@components/general/view_component/ViewComponent";
import Form from "@change_component/Form";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {INPUTS} from "@utils/constants/inputs";
import {NOTIFICATION_TEMPLATE_TOURS} from "@utils/constants/tours";

const notificationTemplatePrefixUrl = '/notification_templates';

function mapStateToProps(state){
    const auth = state.get('auth');
    const notificationTemplates = state.get('notificationTemplates');
    return{
        authUser: auth.get('authUser'),
        fetchingNotificationTemplate: notificationTemplates.get('fetchingNotificationTemplate'),
        notificationTemplate: notificationTemplates.get('notificationTemplate'),
        error: notificationTemplates.get('error'),
    };
}

/**
 * Component to View Notification Template
 */
@connect(mapStateToProps, {fetchNotificationTemplate})
@permission(NotificationTemplatePermissions.READ, true)
@withTranslation(['notification_templates', 'app', 'schedules'])
@SingleComponent('notificationTemplate')
class NotificationTemplateView extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, openTour, notificationTemplate} = this.props;
        let contentTranslations = {};
        contentTranslations.header = {title: t(`VIEW.HEADER`), onHelpClick: openTour};
        contentTranslations.list_button = {title: t(`VIEW.LIST_BUTTON`), link: notificationTemplatePrefixUrl};
        let contents = [{
            inputs: [
                {
                    ...INPUTS.NOTIFICATION_TEMPLATE_NAME,
                    tourStep: NOTIFICATION_TEMPLATE_TOURS.page_1[0].selector,
                    label: t(`VIEW.FORM.NAME`),
                    required: true,
                    maxLength: 255,
                    defaultValue: '',
                    readOnly: true,
                },
                {
                    ...INPUTS.NOTIFICATION_TEMPLATE_TYPE,
                    tourStep: NOTIFICATION_TEMPLATE_TOURS.page_1[1].selector,
                    label: t(`VIEW.FORM.TYPE`),
                    required: true,
                    defaultValue: 0,
                    t,
                    readOnly: true,
                },
            ],
            hint: {text: t(`VIEW.FORM.HINT_1`), openTour},
            header: t(`VIEW.FORM.PAGE_1`),
        },{
            inputs: [
                {
                    ...INPUTS.NOTIFICATION_TEMPLATE_CONTENT,
                    tourStep: NOTIFICATION_TEMPLATE_TOURS,
                    label: t(`VIEW.FORM.CONTENT`),
                    required: true,
                    readOnly: true,
                },
            ],
            hint: {text: t(`VIEW.FORM.HINT_2`), openTour},
            header: t(`VIEW.FORM.PAGE_2`),
        }];
        return (
            <Form
                contents={contents}
                translations={contentTranslations}
                permissions={NotificationTemplatePermissions}
                entity={notificationTemplate}
                type={'view'}
            />
        );
    }
}

export default NotificationTemplateView;