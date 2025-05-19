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
export {protocol, hostname, port};

export const APP_STATUS_DOWN = 'DOWN';
export const APP_STATUS_UP = 'UP';
/**
 * urls for requests
 */

const baseUrl = `${protocol}//${hostname}/`;
const baseUrlApi = `${protocol}//${hostname}/`;
const socketServer = `${protocol}//${hostname}:9090/`;
const kibanaUrl = `${protocol}//${hostname}:5601/app/kibana`;
export const Urls = {
    baseUrl,
    baseUrlApi,
    socketServer,
    kibanaUrl,
}
export const errorTicketUrl = 'https://becon88.atlassian.net/rest/collectors/1.0/template/form/cb37ee4e';
export const onlineServiceOpenCeliumUrl = `https://service.opencelium.io:443/`;
export const onlineApiServerOpenCeliumUrl = 'https://service.opencelium.io:443/api/';
export const offlineServiceOpenCeliumUrls = `${protocol}//${hostname}:${port}/`;
