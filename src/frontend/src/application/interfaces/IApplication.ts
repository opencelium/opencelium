
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

import {PermissionTypes} from "../requests/models/Component";

/**
 * observations that define what class properties should be observable
 */
export interface IObservation{
    value: any,
    functionName: string,
}

export interface DispatchParamsProps<T>{

    // on/off validation before dispatching
    hasNoValidation?: boolean,

    // map entity before dispatching
    mapping?: (entity: T) => any,
}
enum TRIPLET_STATE{
    INITIAL= 'INITIAL',
    TRUE= 'TRUE',
    FALSE= 'FALSE',
}


export const VERSION_STATUS = {
    OLD: 'old',
    CURRENT: 'current',
    AVAILABLE: 'available',
    NOT_AVAILABLE: 'not_available'
}
enum API_REQUEST_STATE{
    INITIAL= 'INITIAL',
    START=  'START',
    FINISH= 'FINISH',
    ERROR=  'ERROR',
    PAUSE=  'PAUSE',
}

const OC_NAME = 'OpenCelium';

const OC_DESCRIPTION = 'OpenCelium is super duper hub';

export const NO_RESTRICTION = {
    entity: 'ALL',
    name: 'ALL'
}
export interface PermissionProps {
    entity: string,
    name: string,
}
export interface ComponentPermissionProps{
    CREATE?: PermissionProps,
    READ?: PermissionProps,
    UPDATE?: PermissionProps,
    DELETE?: PermissionProps,
}

export const NO_NEED_PERMISSION = 'NO_NEED_PERMISSION';

interface IComponent{
    componentId: number,
    name: string,
    permissions?: PermissionProps,
}

interface ComponentProps{
    componentId: number,
    name: string,
    permissions: PermissionTypes[],
}

interface LocalStorageTheme{
    name: string,
    colors: {action: string, menu: string, header: string},
    isCurrent?: boolean,
}

export {
    API_REQUEST_STATE,
    TRIPLET_STATE,
    OC_NAME,
    OC_DESCRIPTION,
    IComponent,
    ComponentProps,
    LocalStorageTheme,
}