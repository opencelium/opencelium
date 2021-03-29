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

import {combineReducers} from 'redux-immutable';
import {responsiveStateReducer} from 'redux-responsive';
import {withReduxStateSync} from 'redux-state-sync';

import {routing} from '../reducers/routing';
import {users} from '../reducers/users';
import {userGroups} from '../reducers/usergroups';
import {auth} from '../reducers/auth';
import {app} from '../reducers/app';
import {components} from '../reducers/components';
import {connectors} from "../reducers/connectors";
import {invokers} from '../reducers/invokers';
import {connections} from "../reducers/connections";
import {schedules} from "../reducers/schedules";
import {apps} from '../reducers/apps';
import {templates} from "../reducers/templates";
import {admincards} from '../reducers/admin_cards';
import {notificationTemplates} from '../reducers/notification_templates';
import {update_assistant} from '../reducers/update_assistant';
import {connection_overview} from "../reducers/connection_overview2";


/**
 * combine reducers for store
 */
const combinedReducers = combineReducers({
    browser: responsiveStateReducer,
    routing,
    users,
    userGroups,
    auth,
    app,
    components,
    connectors,
    invokers,
    connections,
    schedules,
    apps,
    templates,
    admincards,
    notificationTemplates,
    update_assistant,
    connection_overview,
});

export default combinedReducers;