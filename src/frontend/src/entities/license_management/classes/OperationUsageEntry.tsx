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

import {OperationUsageEntryModel} from "@entity/license_management/requests/models/SubscriptionModel";


export class OperationUsageEntry implements OperationUsageEntryModel{
    id: number;

    licenseId: string;

    subId: string;

    connectionTitle: string = '';

    totalUsage: number = 0;

    constructor(operationUsageEntry?: Partial<OperationUsageEntryModel> | null) {
        this.id = operationUsageEntry ? operationUsageEntry.id : 0;
        this.licenseId = operationUsageEntry ? operationUsageEntry.licenseId : '';
        this.subId = operationUsageEntry ? operationUsageEntry.subId : '';
        this.totalUsage = operationUsageEntry ? operationUsageEntry.totalUsage : 0;
        this.connectionTitle = operationUsageEntry ? operationUsageEntry.connectionTitle : '';
    }

}
