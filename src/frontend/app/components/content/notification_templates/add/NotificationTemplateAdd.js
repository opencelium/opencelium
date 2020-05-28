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

import {addNotificationTemplate} from '@actions/notification_templates/add';
import {NotificationTemplatePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {INPUTS} from "@utils/constants/inputs";
import {automaticallyShowTour, NOTIFICATION_TEMPLATE_ADD_TOURS} from "@utils/constants/tours";
import OCTour from "@basic_components/OCTour";
import {SingleComponent} from "@decorators/SingleComponent";
import CNotificationTemplate from "@classes/components/content/schedule/notification/CNotificationTemplate";
import {setFocusById} from "@utils/app";

const notificationTemplatePrefixURL = '/notification_templates';

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
class NotificationTemplateAdd extends Component{

    constructor(props){
        super(props);

        const{authUser} = this.props;

        this.state = {
            notificationTemplate: CNotificationTemplate.createNotificationTemplate(null),
            currentTour: 'page_1',
            isTourOpen: automaticallyShowTour(authUser),
        };
    }

    componentDidMount(){
        setFocusById('input_name');
    }

    /**
     * to set appropriate Tour
     */
    setCurrentTour(pageNumber){
        const {authUser} = this.props;
        this.setState({
            currentTour: `page_${pageNumber}`,
            isTourOpen: automaticallyShowTour(authUser),
        });
    }

    /**
     * to close current Tour
     */
    closeTour(){
        this.setState({
            isTourOpen: false,
        });
    }

    /**
     * to open current Tour
     */
    openTour(){
        let that = this;
        setTimeout(function(){
            that.setState({
                isTourOpen: true,
            });
        }, 100);
    }

    /**
     * to redirect app after update
     */
    redirect(){
        this.props.router.push(`${notificationTemplatePrefixURL}`);
    }

    /**
     * to validate title
     */
    validateName(notificationTemplate){
        const {t} = this.props;
        if(notificationTemplate.name === ''){
            setFocusById('input_name');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.NAME_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    /**
     * to validate type
     */
    validateType(notificationTemplate){
        const {t} = this.props;
        if(notificationTemplate.type === null || notificationTemplate.type === ''){
            setFocusById('input_type');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.TYPE_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    /**
     * to validate content
     */
    validateContent(notificationTemplate){
        const {t} = this.props;
        if(notificationTemplate.content.length !== 0) {
            if (notificationTemplate.content[0].subject === '') {
                setFocusById('input_subject');
                return {value: false, message: t('ADD.VALIDATION_MESSAGES.SUBJECT_REQUIRED')};
            }
            if (notificationTemplate.content[0].body === '') {
                setFocusById('input_body');
                return {value: false, message: t('ADD.VALIDATION_MESSAGES.BODY_REQUIRED')};
            }
        } else{
            setFocusById('input_subject');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.AT_LEAST_ONE_CONTENT_ITEM')};
        }
        return {value: true, message: ''};
    }

    render(){
        const {t, authUser, addingNotificationTemplate, doAction} = this.props;
        let {notificationTemplate, currentTour, isTourOpen} = this.state;
        let contentTranslations = {};
        contentTranslations.header = t('ADD.HEADER');
        contentTranslations.list_button = t('ADD.LIST_BUTTON');
        let changeContentTranslations = {};
        changeContentTranslations.addButton = t('ADD.ADD_BUTTON');
        let getListLink = `${notificationTemplatePrefixURL}`;
        let breadcrumbsItems = [t('ADD.FORM.PAGE_1'), t('ADD.FORM.PAGE_2'), t('ADD.FORM.PAGE_3'), t('ADD.FORM.PAGE_4')];
        let contents = [{
            inputs: [
                {
                    ...INPUTS.NOTIFICATION_TEMPLATE_NAME,
                    tourStep: NOTIFICATION_TEMPLATE_ADD_TOURS.page_1[0].selector,
                    label: t('ADD.FORM.NAME'),
                    required: true,
                    check: (e, entity) => ::this.validateName(e, entity),
                    maxLength: 255,
                },
                {
                    ...INPUTS.NOTIFICATION_TEMPLATE_TYPE,
                    tourStep: NOTIFICATION_TEMPLATE_ADD_TOURS.page_1[1].selector,
                    label: t('ADD.FORM.TYPE'),
                    required: true,
                    check: (e, entity) => ::this.validateType(e, entity),
                    t,
                },
            ],
            hint: {text: t('ADD.FORM.HINT_1'), openTour: ::this.openTour},
        },{
            inputs: [
                {
                    ...INPUTS.NOTIFICATION_TEMPLATE_CONTENT,
                    tourStep: NOTIFICATION_TEMPLATE_ADD_TOURS,
                    label: t('ADD.FORM.CONTENT'),
                    required: true,
                    check: (e, entity) => ::this.validateContent(e, entity),
                    t,
                },
            ],
            hint: {text: t('ADD.FORM.HINT_2'), openTour: ::this.openTour},
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
                    action={doAction}
                    entity={notificationTemplate}
                    isActionInProcess={addingNotificationTemplate}
                    authUser={authUser}
                    onPageSwitch={::this.setCurrentTour}
                />
                <OCTour
                    steps={NOTIFICATION_TEMPLATE_ADD_TOURS[currentTour]}
                    isOpen={isTourOpen}
                    onRequestClose={::this.closeTour}
                    updateDelay={1000}
                />
            </Content>
        );
    }
}

export default NotificationTemplateAdd;