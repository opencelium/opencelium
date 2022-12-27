/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {ListCollectionCardProps, ListProp} from "@application/interfaces/IListCollection";
import { ComponentPermissionProps } from "@application/interfaces/IApplication";
import {TextSize} from "@app_component/base/text/interfaces";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {ColorTheme} from "@style/Theme";
import {ExternalApplication} from "../classes/ExternalApplication";
import {ExternalApplicationProps, IExternalApplication} from "../interfaces/IExternalApplication";

class ExternalApplications extends ListCollection<ExternalApplicationProps>{
    name: string = 'externalApplications';
    entities: IExternalApplication[];
    title = [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'External Application'}];
    keyPropName: ExternalApplicationProps ='id';
    listProps: ListProp<ExternalApplicationProps>[] = [{propertyKey: 'name', width: '40%'}, {propertyKey: 'status', width: '40%'}];
    gridProps: ListCollectionCardProps = {
        title: 'name',
        subtitle: 'status',
        image: (externalApplication: IExternalApplication) => {return externalApplication.icon;},
    };
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return null;
    };
    getListActions?: (entity: IExternalApplication, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        return (
            <React.Fragment>
                <PermissionTooltipButton target={`view_entity_${entity.name.toString()}`} position={'top'} tooltip={'View'} handleClick={() => {window.open(entity.link, '_blank').focus()}} hasBackground={false} icon={'visibility'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>
            </React.Fragment>
        );
    };
    translations = {
        name: 'Name',
        status: 'Status'
    };
    hasSearch = false;
    hasCardLink = true;
    hasCheckboxes = false;
    isCardLinkExternal = true;

    constructor(externalApplications?: any[]) {
        super();
        let externalApplicationInstances = [];
        for(let i = 0; i < externalApplications.length; i++){
            externalApplicationInstances.push(new ExternalApplication(externalApplications[i]));
        }
        this.entities = [...externalApplicationInstances];
    }

    search(externalApplication: IExternalApplication, searchValue: string){
        searchValue = searchValue.toLowerCase();
        const checkName = externalApplication.name ? externalApplication.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkName;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'name':
                this.entities = this.entities.sort((a: IExternalApplication, b: IExternalApplication) => {
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

export default ExternalApplications;