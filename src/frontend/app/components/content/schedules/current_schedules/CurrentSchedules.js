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
import { connect } from 'react-redux';
import ProgressBarElement from "./ProgressBarElement";
import SubHeader from "../../../general/view_component/SubHeader";
import {fetchCurrentSchedules, cancelFetchCurrentSchedules, fetchSchedulesByIds} from '../../../../actions/schedules/fetch';
import styles from '../../../../themes/default/content/schedules/schedules.scss';
import {getThemeClass} from "../../../../utils/app";
import {cancelCurrentSchedule} from "../../../../epics/schedules";
import {withTranslation} from "react-i18next";


/**
 * (implementation coming soon) temporal data for current schedules
 */

function mapStateToProps(state) {
    const auth = state.get('auth');
    const schedules = state.get('schedules');
	return {
        authUser: auth.get('authUser'),
        currentSchedules: schedules.get('currentSchedules').toJS(),
    };
}

/**
 * (not used) Component for Current Schedules
 */
@connect(mapStateToProps, { fetchCurrentSchedules, cancelFetchCurrentSchedules, fetchSchedulesByIds })
@withTranslation(['schedules', 'app'])
class CurrentSchedules extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        this.props.fetchCurrentSchedules();
    }

    componentWillUnmount(){
        cancelCurrentSchedule();
        this.props.cancelFetchCurrentSchedules();
    }

    componentDidUpdate(prevProps){
        let ids = [];
        let oldSchedules = prevProps.currentSchedules;
        let newSchedules = this.props.currentSchedules;
        let index = -1;
        for(let i = 0; i < oldSchedules.length; i++){
            index = newSchedules.findIndex(s => s.schedulerId === oldSchedules[i].schedulerId);
            if(index === -1){
                ids.push(oldSchedules[i].schedulerId);
            }
        }
        if(ids.length > 0) {
            this.props.fetchSchedulesByIds(ids);
        }
    }

    renderProgressBars(){
        const {authUser, t, currentSchedules} = this.props;
        if(currentSchedules && currentSchedules.length > 0) {
            return currentSchedules.map((schedule, key) => {
                return (
                    <ProgressBarElement authUser={authUser} schedule={schedule} key={key} iterator={key + 1}/>
                );
            });
        } else{
            return <div className={styles.schedule_list_empty}>{t('LIST.EMPTY_CURRENT_LIST')}</div>;
        }
    }

    render(){
        const {authUser} = this.props;
        let classNames = [
            'current_schedules',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div className={styles.current_schedules}>
                <SubHeader title={'Current Jobs'} authUser={authUser} className={styles.current_schedule_header}/>
                {this.renderProgressBars()}
            </div>
        );
    }
}


export default CurrentSchedules;