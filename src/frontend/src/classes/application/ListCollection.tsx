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
import {IListCollection, ListCollectionCardProps, ListProp, MultipleTitleProps} from "@interface/application/IListCollection";
import {SortType} from "@organism/collection_view/interfaces";
import {ColorTheme} from "../../components/general/Theme";
import {TextSize} from "@atom/text/interfaces";
import {DeleteButtonStyled} from "@organism/collection_view/styles";
import {ComponentPermissionProps} from "@constants/permissions";
import {PermissionButton, PermissionTooltipButton} from "@atom/button/PermissionButton";
import {ViewType} from "@organism/collection_view/CollectionView";
import {AppDispatch} from "@store/store";
import {API_REQUEST_STATE} from "@interface/application/IApplication";

class ListCollection implements IListCollection{
    dispatch?: AppDispatch;
    deletingEntitiesState?: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;
    uploadingImage?: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;
    title?: string | MultipleTitleProps[] | React.ReactNode;
    keyPropName: string;
    listProps: ListProp[] = [];
    gridProps: ListCollectionCardProps;
    sortingProps: string[] = [];
    translations: any;
    uploadImage: any = false;
    getTopActions?: (viewType?: ViewType, checkedIds?: number[]) => React.ReactNode = () => {return null;};
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        return (
            <React.Fragment>
                <PermissionButton href={`${entity.id}/view`} hasBackground={false} label={'View'} color={ColorTheme.Black} size={TextSize.Size_16} permission={componentPermission.READ}/>
                <PermissionButton href={`${entity.id}/update`} hasBackground={false} label={'Update'} color={ColorTheme.Black} size={TextSize.Size_16} permission={componentPermission.UPDATE}/>
                {hasDeleteButton && <DeleteButtonStyled><PermissionButton hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteById()} hasBackground={false} label={'Delete'} color={ColorTheme.Red} size={TextSize.Size_16} permission={componentPermission.DELETE}/></DeleteButtonStyled>}
            </React.Fragment>
        );
    };
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        return (
            <React.Fragment>
                <PermissionButton href={`${entity.id}/view`} hasBackground={false} icon={'visibility'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>
                <PermissionTooltipButton target={`update_entity_${entity.id.toString()}`} position={'bottom'} tooltip={'Update'} href={`${entity.id}/update`} hasBackground={false} icon={'edit'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.UPDATE}/>
                {hasDeleteButton && <PermissionButton hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteById()} hasBackground={false} icon={'delete'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.DELETE}/>}
            </React.Fragment>
        );
    };
    entities: any[] = [];
    hasActions?: boolean;
    hasCheckboxes?: boolean;
    hasSearch?: boolean;
    filteredEntities?: any[] = [];
    hasCardLink?: boolean = false;
    isCardLinkExternal?: boolean = false;
    currentItem?: any;
    isCurrentItem?: (entity: any) => boolean = (entity) => {return false;};

    constructor(data?: IListCollection) {
        this.hasActions = data && data.hasOwnProperty('hasActions') ? data.hasActions : true;
        this.hasCheckboxes = data && data.hasOwnProperty('hasCheckboxes') ? data.hasCheckboxes : true;
        this.hasSearch = data && data.hasOwnProperty('hasSearch') ? data.hasSearch : true;
    }

    search(element: any, searchValue: string): boolean{
        return true;
    }
    sort(sortingProp: string, sortingType: SortType): void{
    }
    getEntitiesByPage(searchValue: string, page: number, entitiesPerPage: number): any[]{
        let filteredEntities = this.entities.filter(visibleEntity => this.search(visibleEntity, searchValue));
        this.filteredEntities = filteredEntities;
        let newEntities = [];
        let startIndex = (page - 1) * entitiesPerPage;
        let stopIndex = startIndex + entitiesPerPage;
        if(stopIndex > filteredEntities.length){
            stopIndex = filteredEntities.length;
        }
        for(let i = startIndex; i < stopIndex; i++){
            newEntities.push(filteredEntities[i]);
        }
        return newEntities;
    }
    asc(a: string | number, b: string | number): number{
        let result = 0
        if(a < b){
            result = -1;
        }
        if(a > b){
            result = 1;
        }
        return result;
    }
    desc(a: string | number, b: string | number): number{
        let result = 0
        if(a > b){
            result = -1;
        }
        if(a < b){
            result = 1;
        }
        return result;
    }
}

export default ListCollection;