/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React, {FC, useEffect, useRef} from "react";
import {NotificationTemplate} from "@class/schedule/NotificationTemplate";
import FormSection from "@organism/form_section/FormSection";
import FormComponent from "@organism/form/Form";
import {IContent, INotificationTemplate} from "@interface/schedule/INotificationTemplate";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@interface/application/IApplication";
import Button from "@atom/button/Button";
import {IForm} from "@interface/application/IForm";
import {useNavigate, useParams} from "react-router";
import {Form} from "@class/application/Form";
import {Content} from "@class/schedule/Content";


const NotificationTemplateForm: FC<IForm> = ({isAdd, isUpdate, isView}) => {
    const {
        addingNotificationTemplate, currentNotificationTemplate, updatingNotificationTemplate,
        checkingNotificationTemplateName, isCurrentNotificationTemplateHasUniqueName, error,
        gettingNotificationTemplate,
    } = NotificationTemplate.getReduxState();
    const didMount = useRef(false);
    let navigate = useNavigate();
    let urlParams = useParams();
    const shouldFetchNotificationTemplate = isUpdate || isView;
    const form = new Form({isView, isAdd, isUpdate});
    const formData = form.getFormData('Notification Template');
    let notificationTemplateId = 0;
    if(shouldFetchNotificationTemplate){
        notificationTemplateId = parseInt(urlParams.id);
    }
    // @ts-ignore
    const content = Content.createState<IContent>({_readOnly: isView}, isAdd ? null : currentNotificationTemplate?.content[0]);
    const notificationTemplate = NotificationTemplate.createState<INotificationTemplate>({id: notificationTemplateId, _readOnly: isView, content}, isAdd ? null : currentNotificationTemplate);
    useEffect(() => {
        if(shouldFetchNotificationTemplate){
            notificationTemplate.getById()
        }
    },[]);
    useEffect(() => {
        if (didMount.current) {
            if(error === null && (addingNotificationTemplate === API_REQUEST_STATE.FINISH || updatingNotificationTemplate === API_REQUEST_STATE.FINISH)){
                navigate('/notification_templates', { replace: false });
            }
        } else {
            didMount.current = true;
        }
    },[addingNotificationTemplate, updatingNotificationTemplate]);
    const NameInput = notificationTemplate.getText({
        propertyName: "name", props: {autoFocus: true, icon: 'title', label: 'Name', required: true, isLoading: checkingNotificationTemplateName === API_REQUEST_STATE.START, error: isCurrentNotificationTemplateHasUniqueName === TRIPLET_STATE.FALSE ? 'Must be unique' : ''}
    })
    const Type = notificationTemplate.getSelect({propertyName: 'typeSelect', props: {
            icon: 'mail',
            label: 'Type',
            options:[
                {value: '1', label: 'E-Mail'},
            ],
            required: true,
        }})
    const SubjectInput = notificationTemplate.content.getText({
        propertyName: "subject", props: {icon: 'subject', label: 'Subject', required: true}
    })
    const BodyInput = notificationTemplate.content.getTextarea({
        propertyName: "body", props: {icon: 'feed', label: 'Body', required: true}
    })
    let actions = [<Button
        key={'list_button'}
        label={formData.listButton.label}
        icon={formData.listButton.icon}
        href={'/notification_templates'}
    />];
    if(isAdd || isUpdate){
        let handleClick = isAdd ? () => notificationTemplate.add() : () => notificationTemplate.update();
        actions.unshift(<Button
            key={'add_button'}
            label={formData.actionButton.label}
            icon={formData.actionButton.icon}
            handleClick={handleClick}
            isLoading={addingNotificationTemplate === API_REQUEST_STATE.START}
        />);
    }
    const data = {
        title: [{name: 'Admin Cards', link: '/admin_cards'}, {name: formData.formTitle}],
        actions,
        formSections: [
            <FormSection label={{value: 'General Data'}}>
                {NameInput}
                {Type}
            </FormSection>,
            <FormSection label={{value: 'Template Content'}}>
                {SubjectInput}
                {BodyInput}
            </FormSection>
        ]
    }
    return(
        <FormComponent {...data} isLoading={shouldFetchNotificationTemplate && gettingNotificationTemplate === API_REQUEST_STATE.START}/>
    )
}

export default NotificationTemplateForm