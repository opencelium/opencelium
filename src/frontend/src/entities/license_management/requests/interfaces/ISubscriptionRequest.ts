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
import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";


export default interface ISubscriptionRequest {

    //to get all subscriptions (in online mode)
    getAll (): Promise<AxiosResponse<SubscriptionModel[]>>,

    //to get current subscription (in online/offline mode)
    getCurrent (): Promise<AxiosResponse<SubscriptionModel>>,

    //to set current subscription (in online mode)
    setCurrent (): Promise<AxiosResponse<SubscriptionModel>>,

}
