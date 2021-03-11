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
                <SubHeader title={'Current Scheduler'} authUser={authUser} className={styles.widget_subheader}/>
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