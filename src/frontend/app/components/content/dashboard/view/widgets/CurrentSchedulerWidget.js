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
import SubHeader from "@components/general/view_component/SubHeader";
import styles from "@themes/default/content/dashboard/dashboard";
import SchedulesList from "@components/content/schedules/list/SchedulesList";
import {VIEW_TYPE} from "@components/general/list_of_components/List";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

@connect(mapStateToProps, {})
class CurrentSchedulerWidget extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {authUser} = this.props;
        return(
            <div className={styles.current_scheduler_widget}>
                <SubHeader title={'Current Scheduler'} authUser={authUser}/>
                <SchedulesList viewType={VIEW_TYPE.LIST} readOnly noHeader/>
            </div>
        );
    }
}

export default CurrentSchedulerWidget;