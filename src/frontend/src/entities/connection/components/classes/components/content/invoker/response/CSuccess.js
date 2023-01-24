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

import CResponseResult from "@entity/connection/components/classes/components/content/invoker/response/CResponseResult";

/**
 * Class Success for Response
 */
export default class CSuccess extends CResponseResult{

    constructor(success = CSuccess){
        let status = success && success.hasOwnProperty('status') ? success.status : '';
        let body = success && success.hasOwnProperty('body') ? success.body : null;
        let header = success && success.hasOwnProperty('header') ? success.header : [];
        super(status, body, header);
    }

    static createSuccess(success){
        return new CSuccess(success);
    }
}