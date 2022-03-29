import ReactDOM from 'react-dom';
import React, {ChangeEvent, FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import { ScheduleNotificationListProps } from './interfaces';
import {BottomActionsStyled, EmptyListStyled, ScheduleNotificationListStyled, ListStyled} from './styles';
import {Notification} from "@class/schedule/Notification";
import {Button} from "@atom/button/Button";
import {ColorTheme} from "../../general/Theme";
import InputText from "@atom/input/text/InputText";
import ScheduleNotificationForm from "@page/schedule_notification/ScheduleNotificationForm";
import {useAppDispatch} from "../../../hooks/redux";
import {getNotificationsByScheduleId} from "@action/schedule/NotificationCreators";
import {TextSize} from "@atom/text/interfaces";

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
                            <div>
                                <span>{`${notification.name} (${notification.eventType}/${notification.type})`}</span>
                                <Button float={'right'} iconSize={TextSize.Size_20} hasConfirmation={true} confirmationText={'Do you really want to delete?'} hasBackground={false} icon={'delete'} color={ColorTheme.Turquoise} handleClick={() => notification.deleteById()}/>
                                <Button float={'right'} iconSize={TextSize.Size_20} hasBackground={false} icon={'edit'} color={ColorTheme.Turquoise} handleClick={() => onUpdate(notification)}/>
                            </div>
                        );
                    })}
                </ListStyled>
                <BottomActionsStyled>
                    <Button iconSize={TextSize.Size_20} hasBackground={false} icon={'add'} color={ColorTheme.Turquoise} handleClick={onAdd}/>
                    <Button float={'right'} iconSize={TextSize.Size_20} hasBackground={false} icon={'close'} color={ColorTheme.Turquoise} handleClick={close}/>
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