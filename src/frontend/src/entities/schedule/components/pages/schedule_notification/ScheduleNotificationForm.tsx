/*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect, useRef} from "react";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {useAppDispatch} from "@application/utils/store";
import {OptionProps} from "@app_component/base/input/select/interfaces";
import Dialog from "@app_component/base/dialog/Dialog";
import {
    getNotificationTemplatesByType,
} from "@entity/notification_template/redux_toolkit/action_creators/NotificationTemplateCreators";
import {NotificationTemplate} from "@entity/notification_template/classes/NotificationTemplate";
import {Notification} from "../../../classes/Notification";
import {EVENT_TYPE, INotification} from "../../../interfaces/INotification";
import {getNotificationRecipients} from "../../../redux_toolkit/action_creators/NotificationCreators";
import {ScheduleNotificationFormProps} from "./interfaces";


const ScheduleNotificationForm: FC<ScheduleNotificationFormProps> =
    ({
        isAdd,
        isUpdate,
        isView,
        toggle,
        isToggled,
        schedule,
        notificationId,
    }) => {
    const {
        addingNotification, updatingNotification, currentNotification, isCurrentNotificationHasUniqueName, checkingNotificationName,
        gettingNotificationRecipients, recipients, error,
    } = Notification.getReduxState();
    const {
        notificationTemplates, gettingNotificationTemplates,
    } = NotificationTemplate.getReduxState();
    const dispatch = useAppDispatch();
    const notificationTemplatesOptions: OptionProps[] = notificationTemplates.map(notificationTemplate => {return {label: notificationTemplate.name, value: notificationTemplate.templateId}});
    const recipientsOptions: OptionProps[] = recipients.map(recipient => {return {label: recipient.email, value: recipient.email}})
    const didMount = useRef(false);
    const shouldFetchScheduleNotification = isUpdate || isView;
    const notification = Notification.createState<INotification>({id: notificationId, scheduleId: schedule.id, _readOnly: isView}, isAdd ? null : currentNotification);
    useEffect(() => {
        if(shouldFetchScheduleNotification){
            notification.getById()
        }
        dispatch(getNotificationRecipients());
    },[]);
    useEffect(() => {
        if(notification.typeSelect){
            dispatch(getNotificationTemplatesByType(notification.typeSelect.value.toString()));
        }
    }, [notification.typeSelect])
    useEffect(() => {
        if (didMount.current) {
            if(error === null && (addingNotification === API_REQUEST_STATE.FINISH || updatingNotification === API_REQUEST_STATE.FINISH)){
                toggle();
            }
        } else {
            didMount.current = true;
        }
    },[addingNotification, updatingNotification]);
    const TitleInput = notification.getText({
        propertyName: "name", props: {autoFocus: true, icon: 'person', label: 'Name', required: true, isLoading: checkingNotificationName === API_REQUEST_STATE.START, error: isCurrentNotificationHasUniqueName === TRIPLET_STATE.FALSE ? 'The title must be unique' : ''}
    })
    const EventTypeComponent = notification.getRadios({propertyName: 'eventType', props: {
        icon: 'description',
        label: 'Event Type',
        options: [
            {label: 'Pre', value: EVENT_TYPE.PRE, key: EVENT_TYPE.PRE},
            {autoFocus: true, label: 'Post', value: EVENT_TYPE.POST, key: EVENT_TYPE.POST},
            {label: 'Alert', value: EVENT_TYPE.ALERT, key: EVENT_TYPE.ALERT}
        ],
        required: true,
    }})
    const NotificationTypeComponent = notification.getSelect({
        propertyName: "typeSelect", props:{
            icon: 'person',
            label: 'Notification Type',
            options: [{label: 'Email', value: 'email'}],
            required: true,
        }
    });
    const NotificationTemplateComponent = notification.getSelect({
        propertyName: "templateSelect", props:{
            icon: 'person',
            label: 'Template',
            options: notificationTemplatesOptions,
            required: true,
            isLoading: gettingNotificationTemplates === API_REQUEST_STATE.START,
        }
    });
    const RecipientsComponent = notification.getSelect({
        propertyName: "recipientsSelect", props:{
            icon: 'person',
            label: 'Recipients',
            options: recipientsOptions,
            required: true,
            isLoading: gettingNotificationRecipients === API_REQUEST_STATE.START,
            isMultiple: true,
        }
    });
    let actionLabel = isAdd ? 'Add' : isUpdate ? 'Update' : '';
    let action = isAdd ? () => notification.add() : isUpdate ? () => notification.update() : null;
    return(
        <Dialog
            actions={[{label: actionLabel, onClick: action, id: 'action_button'}, {label: 'Cancel', onClick: toggle, id: 'cancel_button'}]}
            active={isToggled}
            toggle={toggle}
            title={`${actionLabel} Notification`}
        >
            {TitleInput}
            {EventTypeComponent}
            {NotificationTypeComponent}
            {!!notification.typeSelect && NotificationTemplateComponent}
            {!!notification.typeSelect && RecipientsComponent}
        </Dialog>
    )
}

export default ScheduleNotificationForm