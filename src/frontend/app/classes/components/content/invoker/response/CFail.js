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

import CResponseResult from "@classes/components/content/invoker/response/CResponseResult";

/**
 * Class Success for Response
 */
export default class CFail extends CResponseResult{

    constructor(fail = CFail){
        let status = fail && fail.hasOwnProperty('status') ? fail.status : '';
        let body = fail && fail.hasOwnProperty('body') ? fail.body : null;
        let header = fail && fail.hasOwnProperty('header') ? fail.header : [];
        super(status, body, header);
    }

    static createFail(fail){
        return new CFail(fail);
    }
}