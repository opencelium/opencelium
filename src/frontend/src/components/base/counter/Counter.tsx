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

import React, {FC, useEffect, useMemo, useState} from "react";
import Text from "@app_component/base/text/Text";
import {CounterStyled} from './styles';
import {CounterProps} from './interface';
import {TextSize} from "@app_component/base/text/interfaces";
import {useAppDispatch} from "@application/utils/store";
import {terminateExecution} from "@entity/schedule/redux_toolkit/action_creators/ScheduleCreators";

const MaxExecutionTime = 2;

const getTime = (totalSeconds: number) => {
    let seconds: number | string = MaxExecutionTime - Math.floor(totalSeconds % 60);
    if(seconds < 10){
        seconds = `0${seconds}`;
    }
    let minutes: number | string = Math.floor(Math.floor(totalSeconds / 60) % 60);
    if(minutes < 10){
        minutes = `0${minutes}`;
    }
    let hours: number | string = Math.floor(Math.floor(Math.floor(totalSeconds / 60) / 60) % 60);
    if(hours < 10){
        hours = `0${hours}`;
    }
    return {
        seconds,
        minutes,
        hours,
    }
}

const Counter: FC<CounterProps> = ({shouldStart, shouldStop, size, style, schedule}) => {
    const dispatch = useAppDispatch();
    const [currentTimer, setCurrentTimer] = useState(0);
    const [localInterval, setLocalInterval] = useState(null);
    useEffect(() => {
        if(localInterval){
            return () => clearInterval(localInterval);
        }
    }, [])
    useEffect(() => {
        if(shouldStart) {
            setLocalInterval(() => setInterval(() => {
                if (currentTimer < MaxExecutionTime) {
                    setCurrentTimer(currentTimer => currentTimer + 1);
                }
            }, 1000));
        }
    }, [shouldStart]);
    useEffect(() => {
        if(shouldStop || currentTimer === MaxExecutionTime) {
            if(currentTimer === MaxExecutionTime) {
                dispatch(terminateExecution(schedule.schedulerId));
            }
            clearInterval(localInterval);
        }
    }, [shouldStop, currentTimer]);
    const time = useMemo(() => getTime(currentTimer), [currentTimer]);
    return (
        <CounterStyled style={style}>
            <Text size={size} value={`${time.hours ? `${time.hours}` : '00'}:${time.minutes ? `${time.minutes}` : '00'}:${time.seconds}`}/>
        </CounterStyled>
    );
}

Counter.defaultProps = {
    shouldStop: false,
    size: TextSize.Size_20,
    style: {},
}

export default Counter;
