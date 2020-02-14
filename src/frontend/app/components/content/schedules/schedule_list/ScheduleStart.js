/*
 * Copyright (C) <2020>  <becon GmbH>
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
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {permission} from "../../../../decorators/permission";
import {triggerSchedule, triggerScheduleSuccessfully} from '../../../../actions/schedules/fetch';
import {SchedulePermissions} from "../../../../utils/constants/permissions";
import TooltipFontIcon from "../../../general/basic_components/tooltips/TooltipFontIcon";
import {getThemeClass} from "../../../../utils/app";
import styles from '../../../../themes/default/content/schedules/schedules.scss';
import Loading from "../../../general/app/Loading";

function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        triggeringSchedule: schedules.get('triggeringSchedule'),
        stateSchedule: schedules.get('schedule'),
    };
}

/**
 * Component to start one schedule
 */
@connect(mapStateToProps, {triggerSchedule, triggerScheduleSuccessfully})
@permission(SchedulePermissions.READ, false)
@withTranslation('schedules')
class ScheduleStart extends Component{

    constructor(props){
        super(props);

        this.enableTriggerSchedule = true;
    }

    /**
     * to trigger schedule
     */
    triggerSchedule(){
        const {schedule} = this.props;
        if(this.enableTriggerSchedule) {
            this.props.triggerSchedule(schedule.getObject());
        }
    }

    render(){
        const {t, authUser, stateSchedule, schedule, triggeringSchedule} = this.props;
        let classNames = ['schedule_list_action', 'trigger_schedule_start_off', 'schedule_start_loading'];
        classNames = getThemeClass({classNames, authUser, styles});
        let trigger_schedule_start = '';
        if(!this.enableTriggerSchedule){
            trigger_schedule_start = styles[classNames.trigger_schedule_start_off];
        }
        return (
            <span className={styles[classNames.schedule_list_action]}>
                {
                    stateSchedule && stateSchedule.id === schedule.id && triggeringSchedule
                        ?
                        <Loading authUser={authUser} className={styles[classNames.schedule_start_loading]}/>
                        :
                        <TooltipFontIcon
                            className={trigger_schedule_start}
                            value={'play_arrow'}
                            tooltip={t('LIST.TOOLTIP_START_ICON')}
                            onClick={::this.triggerSchedule}/>
                }
            </span>
        );
    }
}

ScheduleStart.propTypes = {
    schedule: PropTypes.object.isRequired,
};

export default ScheduleStart;