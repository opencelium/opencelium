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

import React, {FC, useEffect, useRef, useState} from 'react';
import {withTheme} from "styled-components";
import {findTopLeftPosition} from "@application/utils/utils";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {ColorTheme} from "@style/Theme";
import {ScheduleNotificationList} from "../pages/schedule_notification/ScheduleNotificationList";
import {Notification} from "../../classes/Notification";
import {SchedulePermissions} from "../../constants";
import {ScheduleNotificationsIconProps} from "./interfaces";

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
            <PermissionTooltipButton target={`schedule_notifications_${schedule.id}`} tooltip={'Notifications'} position={'top'} color={ColorTheme.Turquoise} permission={SchedulePermissions.READ} icon={'mail'} handleClick={toggleList} hasBackground={false} isLoading={gettingNotificationsByScheduleId === API_REQUEST_STATE.START && schedule.id === currentScheduleId}/>
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