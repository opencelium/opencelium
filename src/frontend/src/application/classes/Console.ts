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

import {Application} from "./Application";

// class to print debugging data
export class Console{

    constructor() {
    }

    /**
     * print data in debug mode
     * @param info
     */
    static print(info: string | number | object | Array<any>): void{
        if(Application.isDebugging) {
            if (typeof (info) === 'string' || typeof (info) === 'number') {
                console.log(info);
            } else if (Array.isArray(info)) {
                console.table(info);
            } else if (info && typeof info === 'object' && info.constructor === Object) {
                console.table(info);
            } else {
                console.table(info);
            }
        }
    }

    getName(): string{
        return 'Console';
    }
}