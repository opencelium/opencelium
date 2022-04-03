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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import { ProgressBarElementProps } from './interfaces';
import {
    ProgressBarElementStyled,
    ProgressBarFromStyled,
    ProgressBarIteratorStyled,
    ProgressBarSectionStyled, ProgressBarStyled, ProgressBarTitleStyled, ProgressBarToStyled
} from './styles';
import {shuffle} from "@utils/app";

const ProgressBarElement: FC<ProgressBarElementProps> =
    ({
        schedule,
        iterator,
    }) => {
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
                <ProgressBarFromStyled>
                    <span>{schedule.fromConnector}</span>
                </ProgressBarFromStyled>
                <ProgressBarTitleStyled>{schedule.title}</ProgressBarTitleStyled>
                <ProgressBarStyled
                    type="linear"
                    mode="determinate"
                    value={progress}
                    buffer={100}
                />
                <ProgressBarToStyled>
                    <span>{schedule.toConnector}</span>
                </ProgressBarToStyled>
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