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
import {usePrevious} from "@application/utils/hooks/usePrevious";
import { LastDurationExecutionProps } from './interfaces';
import {LastDurationExecutionStyled} from "./styles";

const LastDurationExecution: FC<LastDurationExecutionProps> =
    ({
        schedule,
    }) => {
        const prevProps: any = usePrevious({schedule}) || [];
        const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
        useEffect(() => {
            if(prevProps.schedule?.lastExecution?.success?.duration !== schedule?.lastExecution?.success?.duration && typeof prevProps.schedule !== 'undefined') {
                setIsRefreshing(true);
                setTimeout(() => {
                    setIsRefreshing(false);
                }, 500)
            }
        }, [schedule.lastExecution?.success])
        const lastDurationValue = schedule.lastExecution?.success ? Math.trunc(schedule.lastExecution.success.duration / 1000) : '-';
        return (
            <LastDurationExecutionStyled isRefreshing={isRefreshing}>
                {lastDurationValue !== '-' ? `${lastDurationValue === 0 ? '<1' : lastDurationValue}s` : '-'}
            </LastDurationExecutionStyled>
        );
}

LastDurationExecution.defaultProps = {
    hasElasticSearch: false,
}


export {
    LastDurationExecution,
};

export default withTheme(LastDurationExecution);