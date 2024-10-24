/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const isBuild = false;

let {protocol, hostname, port, pathname} = window.location;
if(isBuild){
    protocol = 'https:';
    hostname = 'opencelium-demo.becon.de';
}
const apiPort = window.config.env.urlInfo.port.api;
const socketPort = window.config.env.urlInfo.port.socket;
const kibanaPort = window.config.env.urlInfo.port.kibana;
if(window.config.env.urlInfo.hasOwnProperty('protocol') && window.config.env.urlInfo.protocol !== '') protocol = window.config.env.urlInfo.protocol;
if(window.config.env.urlInfo.hasOwnProperty('hostname') && window.config.env.urlInfo.hostname !== '') hostname = window.config.env.urlInfo.hostname;
if(window.config.env.urlInfo.port.hasOwnProperty('application')) port = window.config.env.urlInfo.port.application;

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

export const appUrl = `${protocol}//${hostname}:${port}/apps`;
export const invokerUrl = `${protocol}//${hostname}:${port}/invokers`;
export const i18nextLoadPath = isBuild ? `${pathname.substring(0, pathname.lastIndexOf('/'))}/locales/{{lng}}/{{ns}}.json` : `${window.location.protocol}//${window.location.host}/locales/{{lng}}/{{ns}}.json`;

export const errorTicketUrl = 'https://becon88.atlassian.net/rest/collectors/1.0/template/form/cb37ee4e';
export const onlineServiceOpenCeliumUrl = `https://service.opencelium.io:443/`;
export const onlineApiServerOpenCeliumUrl = 'https://service.opencelium.io:443/api/';
export const offlineServiceOpenCeliumUrls = `${protocol}//${hostname}:${port}/`;
