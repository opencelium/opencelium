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

import SETTINGS from '@entity/connection/components/settings.json';
import {isBuild} from "@entity/connection/components/utils/constants/app";

let {protocol, hostname, port, pathname} = window.location;
if(isBuild){
    protocol = 'https:';
    hostname = 'opencelium-demo.becon.de';

}
if(SETTINGS.hasOwnProperty('PROTOCOL') && SETTINGS.PROTOCOL !== '') protocol = SETTINGS.PROTOCOL;
if(SETTINGS.hasOwnProperty('HOSTNAME') && SETTINGS.HOSTNAME !== '') hostname = SETTINGS.HOSTNAME;
if(SETTINGS.PORT.hasOwnProperty('APPLICATION') && SETTINGS.PORT.APPLICATION !== 0) port = SETTINGS.PORT.APPLICATION;

export {protocol, hostname, port};
