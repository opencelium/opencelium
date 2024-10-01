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
import ILdapRequest from "../interfaces/ILdap";
import {AxiosResponse} from "axios";
import LdapConfigModel from "@entity/ldap/requests/models/LdapConfigModel";

export default class LdapRequest extends Request implements ILdapRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'ldap', ...settings});
    }

    async getDefaultConfig(): Promise<AxiosResponse<LdapConfigModel>>{
        this.endpoint = '/default/config';
        return super.get<LdapConfigModel>();
    }

    async testConfig(): Promise<AxiosResponse<string>>{
        this.endpoint = '/test';
        return super.post<string>({});
    }
}
