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

import {
    OperationUsageDetailModel,
} from "@entity/license_management/requests/models/SubscriptionModel";


export class OperationUsageDetail implements OperationUsageDetailModel{
    id: number;

    datetime: number;

    number: number = 0;

    constructor(operationUsageEntry?: Partial<OperationUsageDetailModel> | null) {
        this.id = operationUsageEntry ? operationUsageEntry.id : 0;
        this.number = operationUsageEntry ? operationUsageEntry.number : 0;
        this.datetime = operationUsageEntry ? operationUsageEntry.datetime : 0;
    }

}
