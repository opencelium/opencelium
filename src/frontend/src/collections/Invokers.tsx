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

import {IInvoker} from "@interface/invoker/IInvoker";
import React from "react";
import ListCollection from "../classes/application/ListCollection";
import {SortType} from "@organism/collection_view/interfaces";
import {Invoker} from "@class/invoker/Invoker";
import {ListProp} from "@interface/application/IListCollection";
import {AppDispatch} from "@store/store";
import {ComponentPermissionProps, InvokerPermissions} from "@constants/permissions";
import {PermissionButton, PermissionTooltipButton} from "@atom/button/PermissionButton";
import {ViewType} from "@organism/collection_view/CollectionView";
import {deleteInvokersById} from "@action/InvokerCreators";
import {ColorTheme} from "../components/general/Theme";
import {TextSize} from "@atom/text/interfaces";
import {DeleteButtonStyled} from "@organism/collection_view/styles";
import ImportInvokerButton from "@molecule/import_invoker_button/ImportInvokerButton";
import {API_REQUEST_STATE} from "@interface/application/IApplication";


class Invokers extends ListCollection{
    entities: IInvoker[];
    title = [{name: 'Admin Cards', link: '/admin_cards'}, {name: 'Invokers'}];
    keyPropName = 'id';
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
    getTopActions = (viewType: ViewType, checkedIds: number[] = []) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <PermissionButton autoFocus={!hasSearch} key={'add_button'} icon={'add'} href={'add'} label={'Add Invoker'} permission={InvokerPermissions.CREATE}/>
                <ImportInvokerButton/>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedIds.length === 0} hasConfirmation confirmationText={'Do you really want to delete?'}  key={'delete_button'} icon={'delete'} label={'Delete Selected'} handleClick={() => this.dispatch(deleteInvokersById(checkedIds))} permission={InvokerPermissions.DELETE}/>}
            </React.Fragment>
        );
    };
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        return (
            <React.Fragment>
                <PermissionButton href={`${entity.name}/view`} hasBackground={false} icon={'visibility'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>
                <PermissionTooltipButton target={`update_entity_${entity.name.toString()}`} position={'bottom'} tooltip={'Update'} href={`${entity.name}/update`} hasBackground={false} icon={'edit'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.UPDATE}/>
                {hasDeleteButton && <PermissionButton hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteByName()} hasBackground={false} icon={'delete'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.DELETE}/>}
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