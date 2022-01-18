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

import {addSchedule} from "@actions/schedules/add";
import {fetchMetaConnections as fetchConnections} from "@actions/connections/fetch";
import {permission} from "@decorators/permission";
import {SchedulePermissions} from "@utils/constants/permissions";
import {SingleComponent} from "@decorators/SingleComponent";
import {ScheduleForm} from "@components/content/schedules/ScheduleForm";


function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    const connections = state.get('connections');
    return{
        authUser: auth.get('authUser'),
        error: schedules.get('error'),
        connections: connections.get('connections').toJS(),
        fetchingConnections: connections.get('fetchingConnections'),
        addingSchedule: schedules.get('addingSchedule'),
    };
}

function mapSchedule(schedule){
    let updateSchedule = {};
    updateSchedule.title = schedule.title;
    updateSchedule.connectionId = schedule.connection;
    updateSchedule.cronExp = schedule.cronExp;
    updateSchedule.status = true;
    updateSchedule.debugMode = schedule.debugMode;
    updateSchedule.timezone = new Date().getTimezoneOffset();
    return updateSchedule;
}

/**
 * Component to Add Schedule
 */
@connect(mapStateToProps, {addSchedule, fetchConnections})
@permission(SchedulePermissions.CREATE, true)
@withTranslation(['schedules', 'app'])
@SingleComponent('schedule', 'adding', ['connections'], mapSchedule)
@ScheduleForm('add')
class ScheduleAdd extends Component{}

export default ScheduleAdd;