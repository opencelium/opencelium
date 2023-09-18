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
import ModelDataAggregator, {ModelDataAggregatorProps} from "@entity/data_aggregator/requests/models/DataAggregator";
import TooltipButton from "@app_component/base/tooltip_button/TooltipButton";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import Button from "@app_component/base/button/Button";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {ColorTheme} from "@style/Theme";
import {ISchedule} from "@entity/schedule/interfaces/ISchedule";
import {ExecutionStatus} from "@entity/schedule/components/execution_status/ExecutionStatus";
import {switchScheduleStatus} from "@entity/schedule/redux_toolkit/action_creators/ScheduleCreators";
import {AggregatorActive} from "@entity/data_aggregator/components/aggregator_active/AggregatorActive";
import {archiveAggregatorById, unarchiveAggregatorById} from "@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators";
import AggregatorListRaw from "@entity/data_aggregator/components/pages/AggregatorListRaw";

class DataAggregatorCollection extends ListCollection<ModelDataAggregatorProps>{
    name: string = 'dataAggregator';
    title = [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'Data Aggregator'}];
    entities: ModelDataAggregator[];
    keyPropName: ModelDataAggregatorProps ='id';
    sortingProps: ModelDataAggregatorProps[] = ['name', 'active'];
    listProps: ListProp<ModelDataAggregatorProps>[] = [{
        propertyKey: 'name',
        replace: true,
        getValue: (aggregator: ModelDataAggregator) => {
            return <td key={`name_${aggregator.id}`} style={{color: aggregator.active === false ? '#999' : 'unset'}}>{aggregator.name}</td>
        }
    },{
        propertyKey: 'args',
        replace: true,
        getValue: (aggregator: ModelDataAggregator) => {
            return <td key={`args_${aggregator.id}`} style={{color: aggregator.active === false ? '#999' : 'unset'}}>{aggregator.args.map(a => a.name).join(', ')}</td>
        }
    }];
    gridProps = {title: 'name'};
    translations = {
        name: 'Name',
        args: 'Arguments',
        active: 'Archived',
    };
    hasCheckboxes = false;
    getTopActions = (viewType: ViewType, checkedIds: number[] = []) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <Button autoFocus={!hasSearch} key={'add_button'} icon={'add'} href={'add'} label={'Add Aggregator'}/>
            </React.Fragment>
        );
    };
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return null;
    };
    hasCardLink = true;
    ListRawComponent = AggregatorListRaw;

    constructor(aggregators: any[], getListActions?: any, hasArchiveSwitch?: boolean) {
        super();
        let aggregatorInstances = [];
        for(let i = 0; i < aggregators.length; i++){
            aggregatorInstances.push(aggregators[i]);
        }
        if(getListActions){
            this.getListActions = getListActions;
        }
        this.hasSearch = false;
        if(hasArchiveSwitch){
            this.hasSearch = true;
            this.listProps.push({
                propertyKey: 'active',
                getValue: (aggregator: ModelDataAggregator) => {
                    return (
                        <AggregatorActive
                            key={aggregator.id}
                            aggregator={aggregator}
                            onClick={() => {
                                if(aggregator.active === false){
                                    this.dispatch(archiveAggregatorById(aggregator.id));
                                } else{
                                    this.dispatch(unarchiveAggregatorById(aggregator.id));
                                }
                            }}
                        />
                    )},
                replace: true,
                width: '10%',
            })
        }
        this.entities = [...aggregatorInstances];
    }

    search(aggregator: ModelDataAggregator, searchValue: string){
        searchValue = searchValue.toLowerCase().trim();
        let checkName = aggregator.name ? aggregator.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        let checkArchived = searchValue.indexOf('arch') === 0 || searchValue.indexOf('zip') === 0 ? aggregator.active : false;
        let checkUnarchived = searchValue.indexOf('unzip') === 0 ? !aggregator.active : false;
        return checkName || checkArchived || checkUnarchived;
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
            case 'active':
                this.entities = this.entities.sort((a: ModelDataAggregator, b: ModelDataAggregator) => {
                    if(sortingType === SortType.asc){
                        return this.asc(a.active, b.active);
                    } else{
                        return this.desc(a.active, b.active);
                    }
                })
                break;
        }
    }
}

export default DataAggregatorCollection;
