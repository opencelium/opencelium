/*
 * Copyright (C) <2019>  <becon GmbH>
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
import Content from "../../../general/content/Content";
import ChangeContent from "@change_component/ChangeContent";

import {fetchNotificationTemplate} from '@actions/notification_templates/fetch';
import {NotificationTemplatePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {INPUTS} from "@utils/constants/inputs";
import {automaticallyShowTour} from "@utils/constants/tours";
import {SingleComponent} from "@decorators/SingleComponent";
import CNotificationTemplate from "@classes/components/content/schedule/notification/CNotificationTemplate";

const notificationTemplatePrefixURL = '/notification_templates';

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
class NotificationTmeplateView extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, authUser, notificationTemplate} = this.props;
        let contentTranslations = {};
        contentTranslations.header = t('VIEW.HEADER');
        contentTranslations.list_button = t('VIEW.LIST_BUTTON');
        let changeContentTranslations = {};
        changeContentTranslations.updateButton = t('VIEW.VIEW_BUTTON');
        let getListLink = `${notificationTemplatePrefixURL}`;
        let breadcrumbsItems = [t('VIEW.FORM.PAGE_1'), t('VIEW.FORM.PAGE_2'), t('VIEW.FORM.PAGE_3'), t('VIEW.FORM.PAGE_4')];
        let contents = [{
            inputs: [
                {
                    ...INPUTS.NOTIFICATION_TEMPLATE_NAME,
                    label: t('VIEW.FORM.NAME'),
                    required: true,
                    maxLength: 255,
                    readOnly: true,
                },{
                    ...INPUTS.NOTIFICATION_TEMPLATE_TYPE,
                    label: t('VIEW.FORM.TYPE'),
                    required: true,
                    readOnly: true,
                    t,
                },{
                    ...INPUTS.NOTIFICATION_TEMPLATE_CONTENT,
                    label: t('VIEW.FORM.CONTENT'),
                    required: true,
                    readOnly: true,
                    t,
                },
            ],
            hint: {text: t('VIEW.FORM.HINT_1')},
        }];
        return (
            <Content
                translations={contentTranslations}
                getListLink={getListLink}
                permissions={NotificationTemplatePermissions}
                authUser={authUser}
            >
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    authUser={authUser}
                    entity={CNotificationTemplate.createNotificationTemplate(notificationTemplate)}
                    action={null}
                    isActionInProcess={false}
                    noBreadcrumbs={true}
                    noHint={true}
                    noNavigation={true}
                />
            </Content>
        );
    }
}

export default NotificationTmeplateView;