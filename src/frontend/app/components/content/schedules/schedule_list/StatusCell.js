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

import {updateScheduleStatus} from '@actions/schedules/update';
import {connect} from "react-redux";

import styles from '@themes/default/content/schedules/schedules.scss';
import {getThemeClass} from "@utils/app";
import {withTranslation} from "react-i18next";
import TooltipSwitch from "@basic_components/tooltips/TooltipSwitch";
import {NO_DATA} from "@utils/constants/app";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CScheduleControl from "@classes/voice_control/CScheduleControl";


function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return{
        authUser: auth.get('authUser'),
        currentSchedule: schedules.get('schedule'),
        updatingScheduleStatus: schedules.get('updatingScheduleStatus'),
        triggeringSchedule: schedules.get('triggeringSchedule'),
        triggeringScheduleSuccessfully: schedules.get('triggeringScheduleSuccessfully'),
    };
}

/**
 * Cell Component to display status for ScheduleList
 */
@connect(mapStateToProps, {updateScheduleStatus})
@withTranslation('schedules')
class StatusCell extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        CVoiceControl.initCommands({component: this}, CScheduleControl);
    }

    componentDidUpdate(prevProps, prevState){
        if(this.props.schedule.title !== prevProps.schedule.title){
            CVoiceControl.removeCommands({component: this, props: prevProps, state: prevState}, CScheduleControl);
            CVoiceControl.initCommands({component: this}, CScheduleControl);
        }
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component: this}, CScheduleControl);
    }

    /**
     * to change status of the schedule
     */
    manageScheduleStatus(){
        const {schedule, updateScheduleStatus} = this.props;
        schedule.status = !schedule.status;
        updateScheduleStatus(schedule.getObject());
    }

    render(){
        const {schedule, currentSchedule, updatingScheduleStatus, triggeringSchedule, triggeringScheduleSuccessfully, authUser, t, index} = this.props;
        let classNames = [
            'schedule_list_status',
            'schedule_list_status_red',
            'schedule_list_status_green',
            'schedule_list_status_created',
            'schedule_list_switch_status_field',
            'schedule_list_switch_status_thumb',
            'schedule_list_switch_status_on',
            'schedule_list_status_disable',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        const isLoading = (updatingScheduleStatus || triggeringSchedule || triggeringScheduleSuccessfully) && currentSchedule.id === schedule.id;
        const {status, lastExecution} = schedule;
        let backgroundStyle = styles[classNames.schedule_list_status_created];
        if(lastExecution) {
            const failStartTime = schedule.getFailStartTime();
            const successStartTime = schedule.getSuccessStartTime();
            if(failStartTime === NO_DATA && successStartTime === NO_DATA){
                backgroundStyle = styles[classNames.schedule_list_status_created];
            } else if(failStartTime === NO_DATA){
                backgroundStyle = styles[classNames.schedule_list_status_green];
            } else if(successStartTime === NO_DATA){
                backgroundStyle = styles[classNames.schedule_list_status_red];
            } else{
                if(failStartTime > successStartTime){
                    backgroundStyle = styles[classNames.schedule_list_status_red];
                } else{
                    backgroundStyle = styles[classNames.schedule_list_status_green];
                }
            }
        }
        backgroundStyle = `${backgroundStyle} ${styles[classNames.schedule_list_status]}`;
        return (
            <td className={backgroundStyle}>
                <TooltipSwitch
                    id={`switch_status_${index}`}
                    isLoading={isLoading}
                    authUser={authUser}
                    tooltip={schedule.status ? t('LIST.TOOLTIP_ENABLE_SWITCH_FALSE') : t('LIST.TOOLTIP_ENABLE_SWITCH_TRUE')}
                    checked={status}
                    onChange={::this.manageScheduleStatus}
                    middle={true}
                />
            </td>
        );
    }
}

StatusCell.propTypes = {
    schedule: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
};

export default StatusCell;