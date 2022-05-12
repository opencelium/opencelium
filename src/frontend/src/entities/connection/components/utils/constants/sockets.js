/*
 * Copyright (C) <2022>  <becon GmbH>
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

import openSocket from 'socket.io-client';
import {socketServer} from "./url";
import {SOCKET_IS_ON} from "@entity/connection/components/utils/constants/app";


/**
 * open socket
 */

export const socket = SOCKET_IS_ON ? openSocket(socketServer) : {
    on: () => {},
    emit: () => {},
};

/**
 * socket messages for User actions
 */
export const Users = {
    ADD_USER: 'add.user',
    UPDATE_USER: 'update.user',
    UPDATE_USERDETAIL: 'update.userdetail',
    UPDATE_DASHBOARDSETTINGS: 'update.dashboard_settings',
    DELETE_USER: 'delete.user',
};

/**
 * socket messages for UserGroups actions
 */
export const UserGroups = {
    ADD_USERGROUP: 'add.usergroup',
    UPDATE_USERGROUP: 'update.usergroup',
    DELETE_USERGROUP: 'delete.usergroup',
};

/**
 * socket messages for Connectors actions
 */
export const Connectors = {
    ADD_CONNECTOR: 'add.connector',
    UPDATE_CONNECTOR: 'update.connector',
    DELETE_CONNECTOR: 'delete.connector',
};

/**
 * socket messages for Connections actions
 */
export const Connections = {
    ADD_CONNECTION: 'add.connection',
    UPDATE_CONNECTION: 'update.connection',
    DELETE_CONNECTION: 'delete.connection',
};

/**
 * socket messages for Schedules actions
 */
export const Schedules = {
    ADD_SCHEDULE: 'add.schedule',
    UPDATE_SCHEDULE: 'update.schedule',
    DELETE_SCHEDULE: 'delete.schedule',
    DELETE_SCHEDULES: 'delete.schedules',
};