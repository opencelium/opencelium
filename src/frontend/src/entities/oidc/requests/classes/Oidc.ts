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

import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import Request from "@entity/application/requests/classes/Request";
import IOidcRequest, {IOidcConfig} from "../interfaces/IOidc";
import {AxiosResponse} from "axios";

export default class OidcRequest extends Request implements IOidcRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'oidc', ...settings});
    }

    async getConfig(): Promise<AxiosResponse<IOidcConfig>>{
        this.endpoint = '/config';
        return super.get<IOidcConfig>();
    }
}
