import React, {FC, useRef} from 'react';
import {withTheme} from 'styled-components';
import {Notification} from "@molecule/notification/Notification";
import {NotificationPanelProps} from './interfaces';
import {
    ActionsStyled,
    CloseButtonStyled,
    NotificationPanelStyled,
    NotificationsStyled,
    PanelTitleStyled
} from './styles';
import {useEventListener} from "../../../utils";
import {ColorTheme} from "../../general/Theme";
import {INotification} from "@interface/application/INotification";
import {CNotification} from "@class/application/Notification";
import {useAppDispatch} from "../../../hooks/redux";
import {Application} from "@class/application/Application";
import {clearAllNotifications, toggleNotificationPanel} from '@slice/application/ApplicationSlice';
import Text from "@atom/text/Text";
import {TextSize} from "@atom/text/interfaces";

const NotificationPanel: FC<NotificationPanelProps> = ({}) => {
    const dispatch = useAppDispatch();
    const {notifications, isNotificationPanelOpened} = Application.getReduxState();
    const panelRef = useRef() as React.MutableRefObject<HTMLDivElement>;
    let notificationInstances:INotification[] = [];
    for (let i = 0; i < notifications.length; i++){
        notificationInstances.push(new CNotification(notifications[i]));
    }
    const hasNotifications = notificationInstances.length > 0;
    const checkIfClickedOutside = (e: any) => {
        if(panelRef.current !== null){
            if (isNotificationPanelOpened && panelRef.current && !panelRef.current.contains(e.target)) {
                const dialogElement = document.querySelector('[role=dialog]');
                const isPartOfDialog = dialogElement ? document.querySelector('[role=dialog]').contains(e.target) : false;
                if(!isPartOfDialog){
                    dispatch(toggleNotificationPanel());
                }
            }
        }
    }
    useEventListener('mousedown', checkIfClickedOutside, window, isNotificationPanelOpened);
    return (
        <NotificationPanelStyled ref={panelRef} isOpened={isNotificationPanelOpened}>
            <CloseButtonStyled color={ColorTheme.Black} target={'notification_panel_close'} tooltip={'Close'} size={20} hasBackground={false} icon={'close'} onClick={() => dispatch(toggleNotificationPanel())}/>
            <Text value={<PanelTitleStyled>{"Notifications"}</PanelTitleStyled>}/>
            {!hasNotifications ?
                <div>There are no notifications</div>
                :
                <React.Fragment>
                    <ActionsStyled>
                        <div onClick={() => dispatch(clearAllNotifications())}><Text value={"Clear all"} size={TextSize.Size_12}/></div>
                    </ActionsStyled>
                    <NotificationsStyled>
                        {
                            notificationInstances.map((notification: INotification) => (
                                <Notification key={notification.id} notification={notification}/>
                            ))
                        }
                    </NotificationsStyled>
                </React.Fragment>
            }
        </NotificationPanelStyled>
    )
}

NotificationPanel.defaultProps = {
}


export {
    NotificationPanel,
};

export default withTheme(NotificationPanel);