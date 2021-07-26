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

import React from 'react';
import {connect} from 'react-redux';
import ScheduleList from "@components/content/schedules/schedule_list/ScheduleList";
import {fetchSchedules, fetchSchedulesCanceled} from '@actions/schedules/fetch';
import {ListComponent} from "@decorators/ListComponent";
import SubHeader from "@components/general/view_component/SubHeader";
import styles from "@themes/default/content/dashboard/dashboard";
import CurrentSchedules from "@components/content/schedules/current_schedules/CurrentSchedules";

function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        schedules: schedules.get('schedules').toJS(),
        fetchingSchedules: schedules.get('fetchingSchedules'),
    };
}

@connect(mapStateToProps, {fetchSchedules, fetchSchedulesCanceled})
@ListComponent('schedules', true)
class CurrentSchedulerWidget extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {authUser, schedules} = this.props;
        return(
            <div className={styles.current_scheduler_widget}>
                <SubHeader title={'Current Scheduler'} authUser={authUser}/>
                <ScheduleList
                    schedules={schedules}
                    readOnly={true}
                />
                <CurrentSchedules/>
            </div>
        );
    }
}

export default CurrentSchedulerWidget;