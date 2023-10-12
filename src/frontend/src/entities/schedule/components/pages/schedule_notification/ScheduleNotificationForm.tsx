/*
 *  Copyright (C) <2023>  <becon GmbH>
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
import {getAllChannelsByTeam, getAllTeams} from "@entity/schedule/redux_toolkit/action_creators/TeamsCreators";
import Teams from "@entity/schedule/classes/Teams";
import Tool from "@entity/schedule/classes/Tool";
import { getAllTools } from "@entity/schedule/redux_toolkit/action_creators/ToolCreators";


const ScheduleNotificationForm: FC<ScheduleNotificationFormProps> =
    ({
        isAdd,
        isUpdate,
        isView,
        toggle,
        isToggled,
        schedule,
        notificationId,
        isPlural,
        selectedScheduleIds,
    }) => {
    const {
        addingNotification, updatingNotification, currentNotification, isCurrentNotificationHasUniqueName, checkingNotificationName,
        gettingNotificationRecipients, recipients, error, addingNotificationToSelectedSchedules,
    } = Notification.getReduxState();
    const {
        notificationTemplates, gettingNotificationTemplates,
    } = NotificationTemplate.getReduxState();
    const {gettingAllTools, tools} = Tool.getReduxState();
    const {gettingAllTeams, gettingAllChannelsByTeam, teams, channels} = Teams.getReduxState();
    const dispatch = useAppDispatch();
    const notificationTemplatesOptions: OptionProps[] = notificationTemplates.map(notificationTemplate => {return {label: notificationTemplate.name, value: notificationTemplate.templateId}});
    const recipientsOptions: OptionProps[] = recipients.map(recipient => {return {label: recipient.email, value: recipient.email}})
    const didMount = useRef(false);
    const shouldFetchScheduleNotification = isUpdate || isView;
    const notification = Notification.createState<INotification>({
        id: notificationId,
        scheduleId: schedule ? schedule.id : 0,
        _readOnly: isView,
    }, isAdd ? null : currentNotification);
    useEffect(() => {
        if(shouldFetchScheduleNotification){
            notification.getById()
        }
        dispatch(getNotificationRecipients());
        dispatch(getAllTools());
    },[]);
        useEffect(() => {
            if(notification.typeSelect){
                dispatch(getNotificationTemplatesByType(notification.typeSelect.value.toString()));
                if(notification.typeSelect.value === 'teams'){
                    dispatch(getAllTeams());
                }
            }
        }, [notification.typeSelect])
    useEffect(() => {
        if(notification.teamSelect && notification.teamSelect.value){
            dispatch(getAllChannelsByTeam(notification.teamSelect.value.toString()));
        }
    }, [notification.teamSelect])
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
            options: Tool.getToolsOptionsForSelect(tools),
            required: true,
            isLoading: gettingAllTools === API_REQUEST_STATE.START
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
    const NotificationTeamComponent = notification.getSelect({
        propertyName: "teamSelect", props:{
            icon: 'groups',
            label: 'Team',
            options: Teams.getTeamsOptionsForSelect(teams),
            required: true,
            isLoading: gettingAllTeams === API_REQUEST_STATE.START,
        }
    });
    const NotificationChannelComponent = notification.getSelect({
        propertyName: "channelSelect", props:{
            icon: 'workspaces',
            label: 'Channel',
            options: Teams.getChannelsOptionsForSelect(channels),
            required: true,
            isLoading: gettingAllChannelsByTeam === API_REQUEST_STATE.START,
        }
    });
    let actionLabel = isAdd ? 'Add' : isUpdate ? 'Update' : '';
    let action = isPlural ? () => notification.addToSelectedSchedules(selectedScheduleIds) : isAdd ? () => notification.add() : isUpdate ? () => notification.update() : null;
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
            {!!notification.typeSelect && notification.typeSelect.value === 'email' ?
                RecipientsComponent : null
            }
            {!!notification.typeSelect && notification.typeSelect.value === 'teams' ?
                <React.Fragment>
                    {NotificationTeamComponent}
                    {!!notification.teamSelect && NotificationChannelComponent}
                </React.Fragment> : null
            }
        </Dialog>
    )
}

ScheduleNotificationForm.defaultProps = {
    isAdd: true,
    notificationId: 0,
    isPlural: false,
    selectedScheduleIds: [],
}

export default ScheduleNotificationForm
