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
import {ScheduleLogListIconProps} from "./interfaces";
import {ScheduleLogList} from "@entity/schedule/components/schedule_log_list/ScheduleLogList";
import {useAppDispatch} from "@application/utils/store";
import {getLogList} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {clearLogList} from "@root/redux_toolkit/slices/ConnectionLogSlice";

const ScheduleLogListIcon: FC<ScheduleLogListIconProps> =
    ({
        schedulerId,
        connectionId,
        type,
    }) => {
    const dispatch = useAppDispatch();
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [isToggledList, setIsToggledList] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const id = `schedule_logs_${type}_${schedulerId}`;
    const getLogs = async () => {
        setIsLoading(true);
        dispatch(getLogList({schedulerId, connectionId, status: type === 'success' ? 's' : 'f'}));
        setIsLoading(false);
        toggleList();
    }
    const toggleList = () => {
        if (isToggledList) {
            dispatch(clearLogList());
        }
        setIsToggledList(!isToggledList);
    }
    useEffect(() => {
        let iconElem = document.getElementById(id);
        if(iconElem) {
            let position = findTopLeftPosition(id);
            let newX = position.left + (iconElem.offsetWidth / 2) - 190;
            let newY = position.top + (iconElem.offsetHeight / 2) - 10;
            if (x !== newX || y !== newY) {
                setX(newX);
                setY(newY);
            }
        }
    }, [isToggledList])
    return (
        <React.Fragment>
            <PermissionTooltipButton
                target={id}
                tooltip={'Log list'}
                position={'top'}
                permission={SchedulePermissions.READ}
                icon={'more_vert'}
                handleClick={getLogs}
                hasBackground={false}
                isLoading={isLoading}
            />
            <ScheduleLogList x={x} y={y} scheduleId={schedulerId} isVisible={isToggledList} close={toggleList}/>
        </React.Fragment>
    )
}

ScheduleLogListIcon.defaultProps = {
}


export {
    ScheduleLogListIcon,
};

export default withTheme(ScheduleLogListIcon);
