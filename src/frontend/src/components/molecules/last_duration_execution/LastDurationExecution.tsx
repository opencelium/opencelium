import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import { LastDurationExecutionProps } from './interfaces';
import {LastDurationExecutionStyled} from "./styles";
import {usePrevious} from "../../../hooks/usePrevious";

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