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

import {IForm} from "@application/interfaces/IForm";
import {ITheme} from "@style/Theme";
import { ISchedule } from "../../../interfaces/ISchedule";


interface ScheduleNotificationFormProps extends IForm{
    toggle: () => void,
    isToggled: boolean,
    schedule?: ISchedule,
    notificationId?: number,
    isPlural?: boolean,
    selectedScheduleIds?: number[],
}

interface ScheduleNotificationListProps extends ScheduleNotificationListStyledProps{
    theme?: ITheme,
    schedule: ISchedule,
    isVisible?: boolean,
    close: () => void,
}

interface ScheduleNotificationListStyledProps{
    x: number,
    y: number,
}

export {
    ScheduleNotificationFormProps,
    ScheduleNotificationListProps,
    ScheduleNotificationListStyledProps,
}