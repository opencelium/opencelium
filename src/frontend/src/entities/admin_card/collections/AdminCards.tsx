/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import ListCollection from "@application/classes/ListCollection";
import {ListProp} from "@application/interfaces/IListCollection";
import { ComponentPermissionProps } from "@application/interfaces/IApplication";
import {TextSize} from "@app_component/base/text/interfaces";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {IAdminCard} from "../interfaces/IAdminCard";
import {AdminCard} from "../classes/AdminCard";

class AdminCards extends ListCollection{
    entities: IAdminCard[];
    title = 'Admin Cards';
    keyPropName ='id';
    sortingProps = ['name'];
    listProps: ListProp[] = [{propertyKey: 'name', replace: true, getValue: (AdminCard: IAdminCard) => {
        return <td key={AdminCard.id} style={{textAlign: 'left'}}>{AdminCard.name}</td>
    }}];
    gridProps = {title: 'name'};
    translations = {
        name: 'Name',
    };
    hasCheckboxes = false;
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return null;
    };
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return (
            <React.Fragment>
                <PermissionTooltipButton target={`view_entity_${entity.id.toString()}`} position={'top'} tooltip={'View'} href={`${entity.link}`} hasBackground={false} icon={'visibility'} size={TextSize.Size_20} permission={componentPermission.READ}/>
            </React.Fragment>
        );
    };
    hasCardLink = true;

    constructor(adminCards: any[]) {
        super();
        let adminCardInstances = [];
        for(let i = 0; i < adminCards.length; i++){
            adminCardInstances.push(new AdminCard(adminCards[i]));
        }
        this.entities = [...adminCardInstances];
    }

    search(adminCard: IAdminCard, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkName = adminCard.name ? adminCard.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkName;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'name':
                this.entities = this.entities.sort((a: IAdminCard, b: IAdminCard) => {
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

export default AdminCards;