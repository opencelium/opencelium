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
import {withTheme} from 'styled-components';
import { ProgressBarElementProps } from './interfaces';
import {
    BarSectionStyled,
    ProgressBarElementStyled,
    ProgressBarFromStyled,
    ProgressBarIteratorStyled,
    ProgressBarSectionStyled, ProgressBarStyled, ProgressBarTitleStyled, ProgressBarToStyled
} from './styles';
import {TextSize} from "@app_component/base/text/interfaces";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {useAppDispatch} from "@application/utils/store";
import {terminateExecution} from "@entity/schedule/redux_toolkit/action_creators/ScheduleCreators";

const ProgressBarElement: FC<ProgressBarElementProps> =
    ({
        schedule,
        iterator,
        theme,
    }) => {
    const dispatch = useAppDispatch();
    const [progress, setProgress] = useState(0);
    const targetProgress = 98;

    useEffect(() => {
        const intervalTime = 100;
        let totalSeconds = schedule.avgDuration || 7000;
        totalSeconds = totalSeconds / 1000;
        const increment = (targetProgress / totalSeconds) * (intervalTime / 1000);

        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + increment;
                if (next >= targetProgress) {
                    clearInterval(interval);
                    return targetProgress;
                }
                return next;
            });
        }, intervalTime);

        return () => clearInterval(interval);
    }, []);

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
                            value={progress}
                            color={theme?.progressBarElement?.background}
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
