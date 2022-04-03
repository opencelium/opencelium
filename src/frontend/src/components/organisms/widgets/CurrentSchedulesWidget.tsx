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

import React, {FC} from 'react';
import { CurrentSchedulesWidgetStyled } from './styles';
import {ScheduleList} from "@page/schedule/ScheduleList";
import {WidgetTitle} from "@molecule/widget_title/WidgetTitle";

const CurrentSchedulesWidget: FC =
    ({

    }) => {
    return (
        <CurrentSchedulesWidgetStyled >
            <WidgetTitle title={'Current Scheduler'}/>
            <ScheduleList hasTopBar={false} isReadonly={true} hasTitle={false}/>
        </CurrentSchedulesWidgetStyled>
    )
}

CurrentSchedulesWidget.defaultProps = {
}


export {
    CurrentSchedulesWidget,
};
