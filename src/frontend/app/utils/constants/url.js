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

import SETTINGS from '@root/settings.json';

let {protocol, hostname, port} = window.location;
const apiPort = SETTINGS.PORT.API;
const socketPort = SETTINGS.PORT.SOCKET;
const kibanaPort = SETTINGS.PORT.KIBANA;
const neo4jPort = SETTINGS.PORT.NEO4J;
if(SETTINGS.hasOwnProperty('PROTOCOL') && SETTINGS.PROTOCOL !== '') protocol = SETTINGS.PROTOCOL;
if(SETTINGS.hasOwnProperty('HOSTNAME') && SETTINGS.HOSTNAME !== '') hostname = SETTINGS.HOSTNAME;
if(SETTINGS.PORT.hasOwnProperty('APPLICATION') && SETTINGS.PORT.APPLICATION !== 0) port = SETTINGS.PORT.APPLICATION;

export {protocol, hostname, port};

export const APP_STATUS_DOWN = 'DOWN';
export const APP_STATUS_UP = 'UP';

/**
 * urls for requests
 */
export const baseUrl = `${protocol}//${hostname}:${apiPort}/`;
export const baseUrlApi = `${protocol}//${hostname}:${apiPort}/api/`;
export const socketServer = `${protocol}//${hostname}:${socketPort}/`;
export const kibanaUrl = `${protocol}//${hostname}:${kibanaPort}/app/kibana`;
export const neo4jUrl = `${protocol}//${hostname}:${neo4jPort}/`;

export const appUrl = `${protocol}//${hostname}:${port}/apps`;
export const invokerUrl = `${protocol}//${hostname}:${port}/invokers`;
export const connectionOverviewDetailsUrl = `${protocol}//${hostname}:${port}/connection_overview_details`;
export const connectionOverviewTechnicalLayoutUrl = `${protocol}//${hostname}:${port}/connection_overview_technical_layout`;
export const connectionOverviewBusinessLayoutUrl = `${protocol}//${hostname}:${port}/connection_overview_business_layout`;
