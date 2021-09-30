import CNotificationTemplate from "@classes/components/content/schedule/notification/CNotificationTemplate";
import {setFocusById} from "@utils/app";
import {INPUTS} from "@utils/constants/inputs";
import {NOTIFICATION_TEMPLATE_TOURS} from "@utils/constants/tours";
import {NotificationTemplatePermissions} from "@utils/constants/permissions";
import OCTour from "@basic_components/OCTour";
import React from "react";
import Form from "@change_component/Form";
import {API_REQUEST_STATE} from "@utils/constants/app";

/**
 * common component to add and update User
 */
export function NotificationTemplateForm(type) {
    return function (Component) {
        return class extends Component {
            constructor(props) {
                super(props);
                const{notificationTemplate} = this.props;
                this.notificationTemplatePrefixUrl = '/notification_templates';
                this.translationKey = type.toUpperCase();
                this.isUpdate = type === 'update';
                this.isView = type === 'view';
                this.actionName = this.isUpdate ? `updatingNotificationTemplate` : `addingNotificationTemplate`;

                this.state = {
                    validationMessages: {
                        name: '',
                        type: '',
                        subject: '',
                        body: '',
                    },
                    notificationTemplate: CNotificationTemplate.createNotificationTemplate(notificationTemplate ? notificationTemplate : null),
                };
            }

            componentDidMount(){
                setFocusById('input_name');
            }

            /**
             * to clear validation message by name
             */
            clearValidationMessage(name){
                const {setValidationMessage} = this.props;
                setValidationMessage(this, name, '');
            }

            /**
             * to redirect app after add/update
             */
            redirect(){
                this.props.router.push(`${this.notificationTemplatePrefixUrl}`);
            }

            /**
             * to validate title
             */
            validateName(notificationTemplate){
                const {t} = this.props;
                if(notificationTemplate.name === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.NAME_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate type
             */
            validateType(notificationTemplate){
                const {t} = this.props;
                if(notificationTemplate.type === null || notificationTemplate.type === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.TYPE_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate subject
             */
            validateSubject(notificationTemplate){
                const {t} = this.props;
                if(notificationTemplate.content.length !== 0) {
                    if (notificationTemplate.content[0].subject === '') {
                        return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.SUBJECT_REQUIRED`)};
                    }
                } else{
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.AT_LEAST_ONE_CONTENT_ITEM`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate body
             */
            validateBody(notificationTemplate){
                const {t} = this.props;
                if(notificationTemplate.content.length !== 0) {
                    if (notificationTemplate.content[0].body === '') {
                        return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.BODY_REQUIRED`)};
                    }
                } else{
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.AT_LEAST_ONE_CONTENT_ITEM`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to add/update User
             */
            doAction(entity){
                const {doAction} = this.props;
                doAction(entity, this);
            }

            render(){
                const {validationMessages, notificationTemplate} = this.state;
                const {t, openTour, closeTour, isTourOpen} = this.props;
                let contentTranslations = {};
                contentTranslations.header = {title: t(`${this.translationKey}.HEADER`), onHelpClick: openTour};
                contentTranslations.cancel_button = {title: t(`app:FORM.CANCEL`), link: this.notificationTemplatePrefixUrl};
                contentTranslations.action_button = this.isView ? null : {title: t(`${this.translationKey}.${this.translationKey}_BUTTON`), link: this.notificationTemplatePrefixUrl};
                let contents = [{
                    inputs: [
                        {
                            ...INPUTS.NOTIFICATION_TEMPLATE_NAME,
                            error: validationMessages.name,
                            tourStep: NOTIFICATION_TEMPLATE_TOURS.page_1[0].selector,
                            label: t(`${this.translationKey}.FORM.NAME`),
                            required: true,
                            maxLength: 255,
                            defaultValue: '',
                            readOnly: this.isView,
                        },
                        {
                            ...INPUTS.NOTIFICATION_TEMPLATE_TYPE,
                            error: validationMessages.type,
                            tourStep: NOTIFICATION_TEMPLATE_TOURS.page_1[1].selector,
                            label: t(`${this.translationKey}.FORM.TYPE`),
                            required: true,
                            defaultValue: 0,
                            t,
                            readOnly: this.isView,
                        },
                    ],
                    hint: {text: t(`${this.translationKey}.FORM.HINT_1`), openTour},
                    header: t(`${this.translationKey}.FORM.PAGE_1`),
                },{
                    inputs: [
                        {
                            ...INPUTS.NOTIFICATION_TEMPLATE_CONTENT,
                            error: {subject: validationMessages.subject, body: validationMessages.body},
                            tourStep: NOTIFICATION_TEMPLATE_TOURS,
                            label: t(`${this.translationKey}.FORM.CONTENT`),
                            required: true,
                            readOnly: this.isView,
                        },
                    ],
                    hint: {text: t(`${this.translationKey}.FORM.HINT_2`), openTour},
                    header: t(`${this.translationKey}.FORM.PAGE_2`),
                }];
                return (
                    <React.Fragment>
                        <Form
                            contents={contents}
                            translations={contentTranslations}
                            isActionInProcess={this.props[this.actionName] === API_REQUEST_STATE.START}
                            permissions={NotificationTemplatePermissions}
                            clearValidationMessage={::this.clearValidationMessage}
                            action={::this.doAction}
                            entity={notificationTemplate}
                            type={type}
                        />
                        <OCTour
                            steps={NOTIFICATION_TEMPLATE_TOURS.page_1}
                            isOpen={isTourOpen}
                            onRequestClose={closeTour}
                        />
                    </React.Fragment>
                );
            }
        }
    }
}