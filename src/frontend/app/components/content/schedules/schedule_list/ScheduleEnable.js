/*
 * Copyright (C) <2019>  <becon GmbH>
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
import {updateScheduleStatus} from '../../../../actions/schedules/update';
import {SchedulePermissions} from "../../../../utils/constants/permissions";
import {getThemeClass} from "../../../../utils/app";
import styles from '../../../../themes/default/content/schedules/schedules.scss';
import TooltipSwitch from "../../../general/basic_components/tooltips/TooltipSwitch";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Component to enable one schedule
 */
@connect(mapStateToProps, {updateScheduleStatus})
@permission(SchedulePermissions.UPDATE, false)
@withTranslation('schedules')
class ScheduleEnable extends Component{

    constructor(props){
        super(props);
    }

    /**
     * to change status of the schedule
     */
    manageScheduleStatus(){
        const {schedule, updateScheduleStatus} = this.props;
        schedule.status = schedule.status ? false : true;
        updateScheduleStatus(schedule.getObject());
    }

    render(){
        const {t, authUser, schedule} = this.props;
        let classNames = ['schedule_list_action', 'schedule_list_switch_status_field', 'schedule_list_switch_status_thumb', 'schedule_list_switch_status_on'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <span className={styles[classNames.schedule_list_action]}>
                <TooltipSwitch
                    authUser={authUser}
                    tooltip={schedule.status ? t('LIST.TOOLTIP_ENABLE_SWITCH_FALSE') : t('LIST.TOOLTIP_ENABLE_SWITCH_TRUE')}
                    checked={true}
                    onChange={::this.manageScheduleStatus}
                    theme={{
                        field: styles[classNames.schedule_list_switch_status_field],
                        thumb: styles[classNames.schedule_list_switch_status_thumb],
                        on: styles[classNames.schedule_list_switch_status_on]
                    }}
                />
            </span>
        );
    }
}

ScheduleEnable.propTypes = {
    schedule: PropTypes.object.isRequired,
};

export default ScheduleEnable;