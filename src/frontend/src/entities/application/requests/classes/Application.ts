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
import Request from "./Request";
import IApplicationRequest, {GetServicePortalTokenStatusResponse} from "../interfaces/IApplication";
import {AxiosResponse} from "axios";

export default class ApplicationRequest extends Request implements IApplicationRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: '', ...settings});
    }

    async getServicePortalTokenStatus(): Promise<AxiosResponse<GetServicePortalTokenStatusResponse>>{
        this.url = 'application/service-portal-status';
        return super.get<GetServicePortalTokenStatusResponse>();
    }
}
