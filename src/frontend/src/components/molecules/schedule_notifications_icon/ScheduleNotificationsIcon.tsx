import React, {FC, useEffect, useRef, useState} from 'react';
import {ScheduleNotificationsIconProps} from "@molecule/schedule_notifications_icon/interfaces";
import {withTheme} from "styled-components";
import ScheduleNotificationList from "@page/schedule_notification/ScheduleNotificationList";
import {Notification} from "@class/schedule/Notification";
import {findTopLeftPosition} from "../../../utils";
import {PermissionButton} from "@atom/button/PermissionButton";
import {SchedulePermissions} from "@constants/permissions";
import {ColorTheme} from "../../general/Theme";
import {API_REQUEST_STATE} from "@interface/application/IApplication";

const ScheduleNotificationsIcon: FC<ScheduleNotificationsIconProps> =
    ({
        schedule,
    }) => {
    const {
        gettingNotificationsByScheduleId, currentScheduleId,
    } = Notification.getReduxState();
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [isToggledList, setIsToggledList] = useState<boolean>(false);
    const toggleList = () => {
        setIsToggledList(!isToggledList);
    }
    useEffect(() => {
        let iconElem = document.getElementById(`schedule_notifications_${schedule.id}`);
        if(iconElem) {
            let position = findTopLeftPosition(`schedule_notifications_${schedule.id}`);
            let newX = position.left + (iconElem.offsetWidth / 2) - 320;
            let newY = position.top + (iconElem.offsetHeight / 2) + 20;
            if (x !== newX || y !== newY) {
                setX(newX);
                setY(newY);
            }
        }
    }, [])
    return (
        <React.Fragment>
            <PermissionButton id={`schedule_notifications_${schedule.id}`} color={ColorTheme.Turquoise} permission={SchedulePermissions.READ} icon={'mail'} handleClick={toggleList} hasBackground={false} isLoading={gettingNotificationsByScheduleId === API_REQUEST_STATE.START && schedule.id === currentScheduleId}/>
            <ScheduleNotificationList x={x} y={y} schedule={schedule} isVisible={isToggledList} close={toggleList}/>
        </React.Fragment>
    )
}

ScheduleNotificationsIcon.defaultProps = {
}


export {
    ScheduleNotificationsIcon,
};

export default withTheme(ScheduleNotificationsIcon);