import React, {FC, useEffect} from 'react';
import {withTheme} from 'styled-components';
import { CurrentSchedulesProps } from './interfaces';
import {CurrentSchedulesStyled, EmptyListStyled, HeaderStyled} from './styles';
import {Schedule} from "@class/schedule/Schedule";
import {ProgressBarElement} from "@molecule/progress_bar_element/ProgressBarElement";
import {getCurrentSchedules, getSchedulesById} from "@action/schedule/ScheduleCreators";
import {usePrevious} from "../../../hooks/usePrevious";
import {useAppDispatch} from "../../../hooks/redux";

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
                    <ProgressBarElement key={schedule.id} schedule={schedule} iterator={key + 1}/>
                )
            });
        } else{
            return (
                <EmptyListStyled>There are no triggering schedules</EmptyListStyled>
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