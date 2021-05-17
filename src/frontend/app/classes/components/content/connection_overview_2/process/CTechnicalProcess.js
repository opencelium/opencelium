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

import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import {isString} from "@utils/app";

export class CTechnicalProcess extends CProcess{

    constructor(technicalProcess) {
        super(technicalProcess);
    }

    static createTechnicalProcess(process){
        return new CTechnicalProcess(process);
    }

    getObject(){
        let data = super.getObject();
        return{
            ...data,
        }
    }
}