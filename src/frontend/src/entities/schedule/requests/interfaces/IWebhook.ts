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
import {IResponse} from "@application/requests/interfaces/IResponse";
import { IWebhook } from "../../interfaces/IWebhook";

export interface IWebhookRequest{

    //to get webhook by user id and schedule id
    getWebhookByUserIdAndScheduleId(): Promise<AxiosResponse<IWebhook>>,

    //to delete webhook by id
    deleteWebhookById(): Promise<AxiosResponse<IResponse>>,
}