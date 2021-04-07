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
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import Content from "../../general/content/Content";
import ScheduleAdd from "./ScheduleAdd";
import ScheduleList from "./schedule_list/ScheduleList";
import {fetchSchedules, fetchSchedulesCanceled} from '@actions/schedules/fetch';
import {updateScheduleInStore} from '@actions/schedules/update';

import {permission} from "@decorators/permission";
import {SchedulePermissions} from "@utils/constants/permissions";
import {SCHEDULE_TOURS} from "@utils/constants/tours";
import {tour} from "@decorators/tour";
import {ListComponent} from "@decorators/ListComponent";
import CurrentSchedules from "./current_schedules/CurrentSchedules";


const connectorPrefixURL = '/schedule';

function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    const connections = state.get('connections');
    return {
        authUser: auth.get('authUser'),
        schedules: schedules.get('schedules').toJS(),
        connections: connections.get('connections').toJS(),
        fetchingSchedules: schedules.get('fetchingSchedules'),
        fetchingConnections: connections.get('fetchingConnections'),
    };
}

function filterScheduleSteps(tourSteps){
    const {schedules} = this.props;
    let steps = tourSteps;
    if(schedules.length === 0){
        steps = [tourSteps[0]];
    }
    return steps;
}

/**
 * Main Schedule Component
 */
@connect(mapStateToProps, {fetchSchedules, fetchSchedulesCanceled, updateScheduleInStore})
@permission(SchedulePermissions.READ, true)
@withTranslation('schedules')
@ListComponent('schedules')
@tour(SCHEDULE_TOURS, filterScheduleSteps, true)
class Scheduler extends Component{

    constructor(props){
        super(props);

        this.state = {
            checks: [],
            allChecked: false,
            isTourOpen: true,
        };
    }

    /**
     * to set all checkboxes true or false
     */
    setAllChecked(value){
        this.setState({
            allChecked: value,
        });
    }

    /**
     * to set checks state with data
     */
    checkOneSchedule(e, data){
        let {checks, allChecked} = this.state;
        let index = checks.findIndex(c => c.id === data.id);
        if(typeof checks[index] === 'undefined') {
            checks.push({value: true, id: data.id});
        } else {
            let val = !checks[index].value;
            checks[index] = {value: val, id: data.id};
        }
        allChecked = this.isAllChecked(checks);
        this.setState({checks, allChecked});
    }

    /**
     * to delete data from checks state
     */
    deleteCheck(e, data){
        let {checks} = this.state;
        let allChecked = true;
        let index = checks.findIndex(c => c.id === data.key);
        checks.splice(index, 1);
        if(checks.length > 0) {
            for (let i = 0; i < checks.length; i++) {
                if (!checks[i].value) {
                    allChecked = false;
                }
            }
        } else{
            allChecked = false;
        }
        this.setState({checks, allChecked});
    }

    /**
     * to set checks state with schedules
     */
    checkAllSchedules(){
        let {schedules} = this.props;
        let checks = [];
        for(let i = 0; i < schedules.length; i++){
            checks.push({value: !this.state.allChecked, id: schedules[i].schedulerId});
        }
        this.setState({checks, allChecked: !this.state.allChecked});
    }

    /**
     * to check if all checks are checked
     */
    isAllChecked(checks){
        const {schedules} = this.props;
        if(schedules.length !== checks.length){
            return false;
        }
        for(let i = 0; i < checks.length; i++){
            if(!checks[i].value){
                return false;
            }
        }
        return true;
    }

    render(){
        const {t, authUser, schedules, openTour} = this.props;
        const {checks, allChecked} = this.state;
        let contentTranslations = {};
        contentTranslations.header = {title: t('HEADER'), onHelpClick: openTour};
        let getListLink = `${connectorPrefixURL}`;
        return (
            <Content translations={contentTranslations} getListLink={getListLink} style={{marginBottom: '60px'}} authUser={authUser}>
                <ScheduleAdd schedules={schedules} connections={this.props.connections} setAllChecked={::this.setAllChecked}/>
                <ScheduleList
                    schedules={schedules}
                    checks={checks}
                    allChecked={allChecked}
                    checkAllSchedules={::this.checkAllSchedules}
                    checkOneSchedule={::this.checkOneSchedule}
                    deleteCheck={::this.deleteCheck}
                />
                <CurrentSchedules/>
            </Content>
        );
    }
}

export default Scheduler;