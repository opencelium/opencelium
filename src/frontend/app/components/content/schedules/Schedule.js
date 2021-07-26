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
import {ComponentHasCheckboxes} from "@decorators/ComponentHasCheckboxes";


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
        entitiesName: 'schedules',
        entityIdName: 'schedulerId',
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
@ComponentHasCheckboxes()
@tour(SCHEDULE_TOURS, filterScheduleSteps, true)
class Scheduler extends Component{

    constructor(props){
        super(props);

        this.state = {
            isTourOpen: true,
        };
    }

    render(){
        const {t, authUser, schedules, openTour, connections} = this.props;
        const {checks, allChecked, setAllChecked, checkAllEntities, checkOneEntity, deleteCheck, isOneChecked} = this.props;
        let contentTranslations = {};
        contentTranslations.header = {title: t('HEADER'), onHelpClick: openTour};
        let getListLink = `${connectorPrefixURL}`;
        return (
            <Content translations={contentTranslations} getListLink={getListLink} style={{marginBottom: '60px'}} authUser={authUser}>
                <ScheduleAdd schedules={schedules} connections={connections} setAllChecked={setAllChecked}/>
                <ScheduleList
                    schedules={schedules}
                    checks={checks}
                    allChecked={allChecked}
                    checkAllSchedules={checkAllEntities}
                    checkOneSchedule={checkOneEntity}
                    deleteCheck={deleteCheck}
                    isOneChecked={isOneChecked}
                />
                <CurrentSchedules/>
            </Content>
        );
    }
}

export default Scheduler;