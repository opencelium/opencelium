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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import { ProgressBarElementProps } from './interfaces';
import {
    BarSectionStyled,
    ProgressBarElementStyled,
    ProgressBarFromStyled,
    ProgressBarIteratorStyled,
    ProgressBarSectionStyled, ProgressBarStyled, ProgressBarTitleStyled, ProgressBarToStyled
} from './styles';
import {shuffle} from "@application/utils/utils";
import Button from "@basic_components/buttons/Button";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {ColorTheme} from "@style/Theme";
import {TextSize} from "@app_component/base/text/interfaces";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {useAppDispatch} from "@application/utils/store";
import {terminateExecution} from "@entity/schedule/redux_toolkit/action_creators/ScheduleCreators";

const ProgressBarElement: FC<ProgressBarElementProps> =
    ({
        schedule,
        iterator,
    }) => {
    const dispatch = useAppDispatch();
    const calculateStep = () => {
        let {avgDuration} = schedule;
        if(avgDuration === 0){
            avgDuration = 7000;
        }
        avgDuration = avgDuration / 1000;
        let result = [];
        const localSteps = [[400, 600], [500, 500], [1000, 0]];
        for(let i = 0; i < avgDuration; i++){
            let index = parseInt(`${Math.random() * (0 - 3) + 3}`);
            result.push(localSteps[index][0]);
            if(localSteps[index][1] !== 0) {
                result.push(localSteps[index][1]);
            }
        }
        return shuffle(result);
    }
    const calculateProgression = () => {
        const stepsAmount = steps.length;
        let result = [];
        let progressIterator = parseInt(`${95 / stepsAmount}`);
        let sum = 0;
        for(let i = 0; i < stepsAmount; i++){
            let value = sum >= 95 ? 1 : progressIterator * parseInt(`${Math.random() * (1 - 3) + 3}`);
            if(sum + value > 100){
                value = 100 - sum;
            }
            result.push(value);
            sum += value;
        }
        return result;
    }
    const [progress, setProgress] = useState(0);
    const [steps] = useState(calculateStep());
    const [progression] = useState(calculateProgression());
    const [localIterator, setLocalIterator] = useState(0);
    const simulateProgress = () => {
        setTimeout(() => {
            if (progress < 100) {
                if(progression[localIterator] + progress > progress) {
                    setProgress(progression[localIterator] + progress)
                }
            }
            setLocalIterator(localIterator + 1);
            simulateProgress();
        }, steps[localIterator]);
    }
    useEffect(() => {
        simulateProgress();
    }, [])
    return (
        <ProgressBarElementStyled >
            <ProgressBarIteratorStyled>{iterator}.</ProgressBarIteratorStyled>
            <ProgressBarSectionStyled>
                <BarSectionStyled>
                    <ProgressBarFromStyled>
                        <span>{schedule.fromConnector}</span>
                    </ProgressBarFromStyled>
                    <div style={{
                        width: '100%',
                        position: 'relative'
                    }}>
                        <ProgressBarStyled
                            type="linear"
                            mode="determinate"
                            value={progress}
                            buffer={100}
                        />
                        <ProgressBarTitleStyled>{schedule.title}</ProgressBarTitleStyled>
                    </div>
                    <TooltipButton
                        target={`terminate_schedule_${schedule.schedulerId.toString()}`}
                        position={'bottom'}
                        tooltip={'Terminate'}
                        handleClick={() => dispatch(terminateExecution(schedule.schedulerId))}
                        hasBackground={false}
                        icon={'close'}
                        size={TextSize.Size_20}
                    />
                    <ProgressBarToStyled>
                        <span>{schedule.toConnector}</span>
                    </ProgressBarToStyled>
                </BarSectionStyled>
            </ProgressBarSectionStyled>
        </ProgressBarElementStyled>
    )
}

ProgressBarElement.defaultProps = {
}


export {
    ProgressBarElement,
};

export default withTheme(ProgressBarElement);
