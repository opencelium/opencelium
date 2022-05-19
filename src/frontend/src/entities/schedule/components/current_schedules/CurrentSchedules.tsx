/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {FC, useEffect} from 'react';
import {withTheme} from 'styled-components';
import {usePrevious} from "@application/utils/usePrevious";
import {useAppDispatch} from "@application/utils/store";
import { CurrentSchedulesProps } from './interfaces';
import {CurrentSchedulesStyled, EmptyListStyled, HeaderStyled} from './styles';
import {Schedule} from "../../classes/Schedule";
import {getCurrentSchedules, getSchedulesById} from "../../redux_toolkit/action_creators/ScheduleCreators";
import {ProgressBarElement} from "../../components/progress_bar_element/ProgressBarElement";

const CurrentSchedules: FC<CurrentSchedulesProps> =
    ({

    }) => {
    const dispatch = useAppDispatch();
    const {currentSchedules} = Schedule.getReduxState();
    const preProps: any[] = usePrevious({currentSchedules}) || [];
    let interval: any = null;
    useEffect(() => {
        interval = setInterval(() => dispatch(getCurrentSchedules()), 2000)
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        let ids = [];
        let index = -1;
        // @ts-ignore
        let prevCurSchedules = preProps?.currentSchedules || [];
        for(let i = 0; i < prevCurSchedules.length; i++){
            index = currentSchedules.findIndex(s => s.schedulerId === prevCurSchedules[i].schedulerId);
            if(index === -1){
                ids.push(prevCurSchedules[i].schedulerId);
            }
        }
        if(ids.length > 0) {
            dispatch(getSchedulesById({schedulerIds: ids}));
        }
    }, [currentSchedules])
    const getProgressBars = () => {
        if(currentSchedules && currentSchedules.length > 0) {
            return currentSchedules.map((schedule, key) => {
                return (
                    <ProgressBarElement key={schedule.schedulerId} schedule={schedule} iterator={key + 1}/>
                )
            });
        } else{
            return (
                <EmptyListStyled value={"There are no triggering schedules"}/>
            )
        }
    }
    return (
        <CurrentSchedulesStyled >
            <div>
                <HeaderStyled>{'Current Jobs'}</HeaderStyled>
                {getProgressBars()}
            </div>
        </CurrentSchedulesStyled>
    )
}

CurrentSchedules.defaultProps = {
}


export {
    CurrentSchedules,
};

export default withTheme(CurrentSchedules);