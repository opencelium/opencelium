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
import {AppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE, ComponentPermissionProps} from "@application/interfaces/IApplication";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {TextSize} from "@app_component/base/text/interfaces";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {PermissionButton, PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {DeleteButtonStyled} from "@app_component/collection/collection_view/styles";
import {ColorTheme} from "@style/Theme";
import {Invoker} from "../classes/Invoker";
import {deleteInvokersByName} from "../redux_toolkit/action_creators/InvokerCreators";
import { InvokerPermissions } from "../constants";
import {IInvoker} from "../interfaces/IInvoker";
import ImportInvokerButton from "../components/import_invoker_button/ImportInvokerButton";


class Invokers extends ListCollection{
    entities: IInvoker[];
    title = [{name: 'Admin Cards', link: '/admin_cards'}, {name: 'Invokers'}];
    keyPropName = 'name';
    sortingProps = ['name'];
    listProps: ListProp[] = [{propertyKey: 'name', width: '20%'}, {propertyKey: 'description', width: '30%'}, {propertyKey: 'authType', width: '10%'}, {propertyKey: 'operations[name]', width: '20%'}];
    gridProps = {
        title: 'name',
        image: (invoker: IInvoker) => {return invoker.icon;},
    };
    translations = {
        name: 'Name',
        description: 'Description',
        authType: 'Auth Type',
        'operations[name]': 'Operations'
    };
    getTopActions = (viewType: ViewType, checkedNames: string[] = []) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <PermissionButton autoFocus={!hasSearch} key={'add_button'} icon={'add'} href={'add'} label={'Add Invoker'} permission={InvokerPermissions.CREATE}/>
                <ImportInvokerButton/>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedNames.length === 0} hasConfirmation confirmationText={'Do you really want to delete?'}  key={'delete_button'} icon={'delete'} label={'Delete Selected'} handleClick={() => this.dispatch(deleteInvokersByName(checkedNames))} permission={InvokerPermissions.DELETE}/>}
            </React.Fragment>
        );
    };
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        const id = `${entity.name.toString().replaceAll(' ', '_')}`;
        return (
            <React.Fragment>
                <PermissionTooltipButton target={`view_entity_${id}`} position={'top'} tooltip={'View'} href={`${entity.name}/view`} hasBackground={false} icon={'visibility'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>
                <PermissionTooltipButton target={`update_entity_${id}`} position={'top'} tooltip={'Update'} href={`${entity.name}/update`} hasBackground={false} icon={'edit'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.UPDATE}/>
                {hasDeleteButton && <PermissionTooltipButton target={`delete_entity_${id}`} position={'top'} tooltip={'Delete'} hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteByName()} hasBackground={false} icon={'delete'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.DELETE}/>}
            </React.Fragment>
        );
    };
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        return (
            <React.Fragment>
                <PermissionButton href={`${entity.name}/view`} hasBackground={false} label={'View'} color={ColorTheme.Black} size={TextSize.Size_16} permission={componentPermission.READ}/>
                <PermissionButton href={`${entity.name}/update`} hasBackground={false} label={'Update'} color={ColorTheme.Black} size={TextSize.Size_16} permission={componentPermission.UPDATE}/>
                {hasDeleteButton && <DeleteButtonStyled><PermissionButton hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteByName()} hasBackground={false} label={'Delete'} color={ColorTheme.Red} size={TextSize.Size_16} permission={componentPermission.DELETE}/></DeleteButtonStyled>}
            </React.Fragment>
        );
    };
    dispatch: AppDispatch = null;
    deletingEntitiesState: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;
    uploadingImage: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    constructor(invokers: any[], dispatch: AppDispatch, deletingEntitiesState?: API_REQUEST_STATE, uploadingImage?: API_REQUEST_STATE) {
        super();
        let invokerInstances = [];
        for(let i = 0; i < invokers.length; i++){
            invokerInstances.push(new Invoker({...invokers[i], dispatch}));
        }
        this.dispatch = dispatch;
        this.deletingEntitiesState = deletingEntitiesState;
        this.uploadingImage = uploadingImage;
        this.entities = [...invokerInstances];
    }

    search(invoker: IInvoker, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkName = invoker.name ? invoker.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkName;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'name':
                this.entities = this.entities.sort((a: IInvoker, b: IInvoker) => {
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

export default Invokers;