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

import {AxiosResponse} from "axios";
import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {IWebhook} from "../../interfaces/IWebhook";
import {IWebhookRequest} from "../interfaces/IWebhook";


export class WebhookRequest extends Request implements IWebhookRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'webhook', ...settings});
    }

    async getWebhookByUserIdAndScheduleId(): Promise<AxiosResponse<IWebhook>>{
        return super.get<IWebhook>();
    }

    async deleteWebhookById(): Promise<AxiosResponse<IResponse>>{
        return super.delete<IResponse>();
    }
}