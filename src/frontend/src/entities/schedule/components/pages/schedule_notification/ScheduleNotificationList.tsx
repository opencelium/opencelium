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

import ReactDOM from 'react-dom';
import React, {ChangeEvent, FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {useAppDispatch} from "@application/utils/store";
import InputText from "@app_component/base/input/text/InputText";
import {TextSize} from "@app_component/base/text/interfaces";
import {ColorTheme} from "@style/Theme";
import TooltipButton from '@app_component/base/tooltip_button/TooltipButton';
import {Notification} from "../../../classes/Notification";
import {getNotificationsByScheduleId} from "../../../redux_toolkit/action_creators/NotificationCreators";
import { ScheduleNotificationListProps } from './interfaces';
import {BottomActionsStyled, EmptyListStyled, ScheduleNotificationListStyled, ListStyled} from './styles';
import ScheduleNotificationForm from "./ScheduleNotificationForm";
import {useConstructor} from "@application/utils/hooks/useConstructor";
import {useEventListener} from "@application/utils/utils";

const ScheduleNotificationList: FC<ScheduleNotificationListProps> =
    ({
        x,
        y,
        schedule,
        isVisible,
        close,
    }) => {
    if(!isVisible) return null;
    const dispatch = useAppDispatch();
    const {
        notifications,
    } = Notification.getReduxState();
    useEffect(() => {
        dispatch(getNotificationsByScheduleId(schedule.id));
    }, [])
    const [isToggled, changeIsToggled] = useState<boolean>(false);
    const toggle = () =>{
        changeIsToggled(!isToggled);
    }
    const [searchValue, setSearchValue] = useState<string>('');
    const [isAdd, setIsAdd] = useState<boolean>(false);
    const [currentNotificationId, setCurrentNotificationId] = useState<number>(0);
    const onAdd = () => {
        setIsUpdate(false);
        setIsAdd(true);
        toggle();
    }
    const [isUpdate, setIsUpdate] = useState<boolean>(false);
    const onUpdate = (notification: Notification) => {
        setIsAdd(false);
        setIsUpdate(true);
        setCurrentNotificationId(notification.id)
        toggle();
    }
    const search = (value: string) => {
        setSearchValue(value);
    }
    let notificationEntities: Notification[] = notifications
        .map(notification => {
            return new Notification(notification);
        })
        .filter(notification => {
            return notification.name.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1;
        });
    const checkIfClickedOutside = (e: any) => {
        const listNode = document.getElementById('schedule_notification_list');
        if(listNode){
            if (isVisible && !listNode.contains(e.target)) {
                const inputElement = document.querySelector('[role=dialog]');
                const isPartOfDialog = inputElement ? document.querySelector('[role=dialog]').contains(e.target) : false;
                if(!isPartOfDialog){
                    close();
                }
            }
        }
    }
    useEventListener('mousedown', checkIfClickedOutside, window, isVisible);
    return (
        ReactDOM.createPortal(
            <ScheduleNotificationListStyled x={x} y={y}>
                <div>
                    <InputText autoFocus value={searchValue} onChange={(e:ChangeEvent<HTMLInputElement>) => search(e.target.value)} minHeight={'30px'}/>
                </div>
                <ListStyled>
                    {notificationEntities.length === 0 && <EmptyListStyled value={'There are no notifications'}/>}
                    {notificationEntities.map(notification => {
                        return (
                            <div key={notification.id}>
                                <span>{`${notification.name} (${notification.eventType}/${notification.type})`}</span>
                                <TooltipButton target={`delete_schedule_notification_${notification.id}`} tooltip={'Delete'} float={'right'} iconSize={TextSize.Size_20} hasConfirmation={true} confirmationText={'Do you really want to delete?'} hasBackground={false} icon={'delete'} color={ColorTheme.Turquoise} handleClick={() => notification.deleteById()}/>
                                <TooltipButton target={`update_schedule_notification_${notification.id}`} tooltip={'Update'} float={'right'} iconSize={TextSize.Size_20} hasBackground={false} icon={'edit'} color={ColorTheme.Turquoise} handleClick={() => onUpdate(notification)}/>
                            </div>
                        );
                    })}
                </ListStyled>
                <BottomActionsStyled>
                    <TooltipButton target={`add_schedule_notification`} tooltip={'Add'} position={'top'} iconSize={TextSize.Size_20} hasBackground={false} icon={'add'} color={ColorTheme.Turquoise} handleClick={onAdd}/>
                    <TooltipButton target={'close_schedule_notification'} tooltip={'Close'} position={'top'} float={'right'} iconSize={TextSize.Size_20} hasBackground={false} icon={'close'} color={ColorTheme.Turquoise} handleClick={close}/>
                </BottomActionsStyled>
                {isToggled && <ScheduleNotificationForm schedule={schedule} notificationId={currentNotificationId} isAdd={isAdd} isUpdate={isUpdate} isToggled={isToggled} toggle={toggle}/>}
            </ScheduleNotificationListStyled>,
            document.getElementById('schedule_notification_list')
        )
    )
}

ScheduleNotificationList.defaultProps = {
    isVisible: false,
}


export {
    ScheduleNotificationList,
};

export default withTheme(ScheduleNotificationList);