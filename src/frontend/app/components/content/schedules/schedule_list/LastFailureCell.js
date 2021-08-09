/*
 * Copyright (C) <2021>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {convertTimeForSchedulerList, isNumber} from "@utils/app";
import {NO_DATA} from "@utils/constants/app";

import styles from '@themes/default/content/schedules/schedules.scss';
import {EMPHASIZE_DURATION_ANIMATION} from "./ScheduleList";
import {kibanaUrl} from "@utils/constants/url";
import CSchedule from "@classes/components/content/schedule/CSchedule";

/**
 * Cell Component to display last failure for ScheduleList
 */
class LastFailureCell extends Component{

    constructor(props){
        super(props);
        this.state = {
            appearClassName: '',
        };
    }

    componentDidUpdate(prevProps){
        const {appearClassName} = this.state;
        const curSchedule = CSchedule.createSchedule(this.props.schedule);
        const prevSchedule = CSchedule.createSchedule(prevProps.schedule);
        let newTime = curSchedule.getFailEndTime();
        let newId = curSchedule.id;
        let oldTime = prevSchedule.getFailEndTime();
        let oldId = prevSchedule.id;
        if(newTime !== NO_DATA) {
            if(newId === oldId && newTime !== oldTime && appearClassName !== styles.emphasize_cell) {
                this.setState({appearClassName: styles.emphasize_cell});
                setTimeout(() => {this.setState({appearClassName: ''});}, 2000);
            }
        } else{
            if(appearClassName !== '') {
                this.setState({appearClassName: ''});
            }
        }
    }

    renderData(){
        const {appearClassName} = this.state;
        let {hasElasticSearch} = this.props;
        const schedule = CSchedule.createSchedule(this.props.schedule);
        let time = schedule.getFailEndTime();
        let taId = schedule.getFailTaId();
        let executionId = schedule.getFailExecutionId();
        let url = '#';
        if(time !== NO_DATA) {
            time = convertTimeForSchedulerList(time, 'full');
            if(taId !== ''){
                url = `${kibanaUrl}#/discover?_g=()&_a=(columns:!(taId,orderId,message,method,exchange,methodPart,datetime),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'96f425a0-ce27-11e9-8c24-b7d9afe6d21c',key:taId,negate:!f,params:(query:'${taId}',type:phrase),type:phrase,value:'${taId}'),query:(match:(taId:(query:'${taId}',type:phrase))))),index:'96f425a0-ce27-11e9-8c24-b7d9afe6d21c',interval:auto,query:(language:lucene,query:''),sort:!(orderId,asc))`;
            }
        } else{
            taId = '';
        }
        return (
            <div className={`${styles.last_success_cell} ${appearClassName}`}>
                <div>{time}</div>
                {
                    taId === ''
                    ?
                        null
                    :
                        !hasElasticSearch
                        ?
                            <span>#{executionId}</span>
                        :
                            <a id={`last_fail_${schedule.id}`} href={url} target={'_blank'}>#{executionId}</a>
                }
            </div>
        );
    }

    render(){
        return (
            <td>
                {::this.renderData()}
            </td>
        );
    }
}

LastFailureCell.propTypes = {
    schedule: PropTypes.object.isRequired,
    hasElasticSearch: PropTypes.bool,
};

LastFailureCell.defaultProps = {
    hasElasticSearch: false,
};

export default LastFailureCell;