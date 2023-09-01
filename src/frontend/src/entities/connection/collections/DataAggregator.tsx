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

import React from "react";
import ListCollection from "@application/classes/ListCollection";
import {ListProp} from "@application/interfaces/IListCollection";
import { ComponentPermissionProps } from "@application/interfaces/IApplication";
import {TextSize} from "@app_component/base/text/interfaces";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import ModelDataAggregator, {ModelDataAggregatorProps} from "@root/requests/models/DataAggregator";
import TooltipButton from "@app_component/base/tooltip_button/TooltipButton";

class DataAggregatorCollection extends ListCollection<ModelDataAggregatorProps>{
    name: string = 'dataAggregator';
    entities: ModelDataAggregator[];
    keyPropName: ModelDataAggregatorProps ='id';
    hasSearch = false;
    sortingProps: ModelDataAggregatorProps[] = ['name'];
    listProps: ListProp<ModelDataAggregatorProps>[] = [{
        propertyKey: 'name',
        replace: true,
        getValue: (aggregator: ModelDataAggregator) => {
            return <td key={`name_${aggregator.id}`}>{aggregator.name}</td>
        }
    },{
        propertyKey: 'args',
        replace: true,
        getValue: (aggregator: ModelDataAggregator) => {
            return <td key={`args_${aggregator.id}`}>{aggregator.args.map(a => a.name).join(', ')}</td>
        }
    }];
    gridProps = {title: 'name'};
    translations = {
        name: 'Name',
        args: 'Arguments',
    };
    hasCheckboxes = false;
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return null;
    };
    getListActions: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return (
            <React.Fragment>
                <TooltipButton target={`view_entity_${entity.id.toString()}`} position={'top'} tooltip={'View'} hasBackground={false} icon={'visibility'} size={TextSize.Size_20}/>
            </React.Fragment>
        );
    };
    hasCardLink = true;

    constructor(aggregators: any[], getListActions: any) {
        super();
        let aggregatorInstances = [];
        for(let i = 0; i < aggregators.length; i++){
            aggregatorInstances.push(aggregators[i]);
        }
        this.getListActions = getListActions;
        this.entities = [...aggregatorInstances];
    }

    search(aggregator: ModelDataAggregator, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkName = aggregator.name ? aggregator.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkName;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'name':
                this.entities = this.entities.sort((a: ModelDataAggregator, b: ModelDataAggregator) => {
                    if(sortingType === SortType.asc){
                        return this.asc(a.name, b.name);
                    } else{
                        return this.desc(a.name, b.name);
                    }
                })
                break;
        }
    }
}

export default DataAggregatorCollection;
