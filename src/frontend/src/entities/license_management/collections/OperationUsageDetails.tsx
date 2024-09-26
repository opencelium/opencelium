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
import React from 'react';
import ListCollection from "@application/classes/ListCollection";
import {ListProp} from "@application/interfaces/IListCollection";
import {OperationUsageDetailModel} from "@entity/license_management/requests/models/SubscriptionModel";
import {OperationUsageDetailProps} from "@entity/license_management/interfaces/ISubscription";
import {OperationUsageDetail} from "@entity/license_management/classes/OperationUsageDetail";
import {convertTimeForTotalUsage} from "@application/utils/utils";

class OperationUsageDetails extends ListCollection<OperationUsageDetailProps>{
    entities: OperationUsageDetailModel[];
    keyPropName: OperationUsageDetailProps ='startDate';
    listProps: ListProp<OperationUsageDetailProps>[] = [
        {
            propertyKey: 'startDate',
            width: '50%',
            getValue: (entity: OperationUsageDetailModel) => {
                return (
                    <span>{convertTimeForTotalUsage(entity.startDate)}</span>
                )
            }
        },
        {
            propertyKey: 'operationUsage',
            width: '50%',
        },
    ];
    translations = {
        startDate: 'Start date',
        operationUsage: 'API Operations',
    };
    hasSearch = false;
    hasActions = false;
    hasCheckboxes = false;

    constructor(details: OperationUsageDetailModel[]) {
        super();
        let detailInstance = [];
        for(let i = 0; i < details.length; i++){
            detailInstance.push(new OperationUsageDetail({...details[i]}));
        }
        this.entities = [...detailInstance];
    }
}

export default OperationUsageDetails;
