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

import ListCollection from "@application/classes/ListCollection";
import {ListProp} from "@application/interfaces/IListCollection";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {OperationUsageEntryModel} from "@entity/license_management/requests/models/SubscriptionModel";
import {OperationUsageEntryProps} from "@entity/license_management/interfaces/ISubscription";
import {OperationUsageEntry} from "@entity/license_management/classes/OperationUsageEntry";
import DefaultListRaw from "@app_component/collection/default_list_raw/DefaultListRaw";

class OperationUsageEntries extends ListCollection<OperationUsageEntryProps>{
    name: string = 'operation_usage_entries';
    entities: OperationUsageEntryModel[];
    keyPropName: OperationUsageEntryProps ='';
    sortingProps: OperationUsageEntryProps[] = ['title'];
    ListRawComponent = DefaultListRaw;
    listProps: ListProp<OperationUsageEntryProps>[] = [
        {
            propertyKey: 'title',
            width: '50%',
        },
        {
            propertyKey: 'number',
            width: '50%',
        },
    ];
    translations = {
        title: 'Connection',
        number: 'API Operations',
    };
    hasSearch = false;
    hasActions = false;
    hasCheckboxes = false;

    constructor(entries: OperationUsageEntryModel[]) {
        super();
        let entryInstance = [];
        for(let i = 0; i < entries.length; i++){
            entryInstance.push(new OperationUsageEntry({...entries[i]}));
        }
        this.entities = [...entryInstance];
    }

    search(connector: OperationUsageEntryModel, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkTitle = connector.title ? connector.title.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkTitle;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'title':
                this.entities = this.entities.sort((a: OperationUsageEntryModel, b: OperationUsageEntryModel) => {
                    if(sortingType === SortType.asc){
                        return this.asc(a.title, b.title);
                    } else{
                        return this.desc(a.title, b.title);
                    }
                })
                break;
        }
    }
}

export default OperationUsageEntries;
