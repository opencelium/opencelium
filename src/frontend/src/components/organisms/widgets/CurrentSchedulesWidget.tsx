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
