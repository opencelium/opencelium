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
import {Urls} from "@entity/application/requests/classes/url";
import {usePrevious} from "@application/utils/hooks/usePrevious";
import {convertTimeForSchedulerList} from "@application/utils/utils";
import { LastFailExecutionProps } from './interfaces';
import {LastFailExecutionStyled} from "./styles";
import {getLogsByExecutionId} from "@entity/schedule/redux_toolkit/action_creators/ScheduleCreators";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {useAppDispatch} from "@application/utils/store";
import {Schedule} from "@entity/schedule/classes/Schedule";
import Icon from "@app_component/base/icon/Icon";
import {LoadingIcon} from "@entity/schedule/components/last_success_execution/styles";

const LastFailExecution: FC<LastFailExecutionProps> =
    ({
        schedule,
        hasElasticSearch,
        theme,
    }) => {
        const dispatch = useAppDispatch()
        const {gettingLogsByExecutionId} = Schedule.getReduxState();
        const [startGettingLogs, setStartGettingLogs] = useState<boolean>(false);
        const prevProps: any = usePrevious({schedule}) || [];
        const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
        const getLogs = (executionId: string) => {
            setStartGettingLogs(true);
            dispatch(getLogsByExecutionId(executionId));
        }
        useEffect(() => {
            if (startGettingLogs) {
                switch (gettingLogsByExecutionId) {
                    case API_REQUEST_STATE.FINISH:
                    case API_REQUEST_STATE.ERROR:
                        setStartGettingLogs(false);
                        break;
                }
            }
        }, [gettingLogsByExecutionId]);
        useEffect(() => {
            if(prevProps.schedule?.lastExecution?.fail?.taId !== schedule?.lastExecution?.fail?.taId && typeof prevProps.schedule !== 'undefined') {
                setIsRefreshing(true);
                setTimeout(() => {
                    setIsRefreshing(false);
                }, 500)
            }
        }, [schedule.lastExecution?.fail])
        if(schedule.lastExecution?.fail) {
            const time = convertTimeForSchedulerList(schedule.lastExecution.fail.startTime, 'full');
            let taId = schedule.lastExecution.fail.taId;
            let url, executionId = '';
            let taIdComponent = null;
            if (taId !== '') {
                executionId = taId.split('-')[1]
                url = `${Urls.kibanaUrl}#/discover?_g=()&_a=(columns:!(taId,orderId,message,method,exchange,methodPart,datetime),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'96f425a0-ce27-11e9-8c24-b7d9afe6d21c',key:taId,negate:!f,params:(query:'${taId}',type:phrase),type:phrase,value:'${taId}'),query:(match:(taId:(query:'${taId}',type:phrase))))),index:'96f425a0-ce27-11e9-8c24-b7d9afe6d21c',interval:auto,query:(language:lucene,query:''),sort:!(orderId,asc))`;
                if(hasElasticSearch){
                    taIdComponent = <a id={`last_fail_${schedule.id}`} href={url} target={'_blank'}>#{executionId}</a>;
                } else{
                    if (schedule.lastExecution.fail.hasLog) {
                        taIdComponent = startGettingLogs ?
                            <LoadingIcon loadingSize={'16px'} color={theme?.menu?.background || '#000'} name={' '}
                                         isLoading={true}/> :
                            <span id={'clickable'} style={{cursor: 'pointer', textDecoration: 'underline'}}
                                  onClick={() => getLogs(executionId)}>{`#${executionId}`}</span>;
                    } else {
                        taIdComponent = <span>{`#${executionId}`}</span>
                    }
                }
            }
            return (
                <LastFailExecutionStyled isRefreshing={isRefreshing}>
                    <div>{time}</div>
                    {executionId !== '' && taIdComponent}
                </LastFailExecutionStyled>
            );
        }
        return null;
}

LastFailExecution.defaultProps = {
    hasElasticSearch: false,
}


export {
    LastFailExecution,
};

export default withTheme(LastFailExecution);
