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
import ListCollection from "../classes/application/ListCollection";
import {IUserGroup} from "@interface/usergroup/IUserGroup";
import {UserGroup} from "@class/usergroup/UserGroup";
import {SortType} from "@organism/collection_view/interfaces";
import {ListProp} from "@interface/application/IListCollection";
import {AppDispatch} from "@store/store";
import {PermissionButton, PermissionTooltipButton} from "@atom/button/PermissionButton";
import {ComponentPermissionProps, UserGroupPermissions} from "@constants/permissions";
import {ViewType} from "@organism/collection_view/CollectionView";
import {deleteUserGroupsById} from "@action/UserGroupCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {ColorTheme} from "../components/general/Theme";
import {TextSize} from "@atom/text/interfaces";

class UserGroups extends ListCollection{
    entities: IUserGroup[];
    title = [{name: 'Admin Cards', link: '/admin_cards'}, {name: 'User Groups'}];
    keyPropName ='id';
    sortingProps = ['name'];
    listProps: ListProp[] = [{propertyKey: 'name', width: '20%'}, {propertyKey: 'description', width: '30%'}, {propertyKey: 'components[name]', width: '30%'}];
    gridProps = {
        title: 'name',
        //image: (userGroup: IUserGroup) => {return userGroup.icon;},
    };
    translations = {
        name: 'Name',
        description: 'Description',
        ['components[name]']: 'Permissions',
    };
    getTopActions = (viewType: ViewType, checkedIds: number[]) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <PermissionButton autoFocus={!hasSearch} key={'add_button'} icon={'add'} href={'add'} label={'Add Group'} permission={UserGroupPermissions.CREATE}/>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedIds.length === 0} hasConfirmation confirmationText={'Do you really want to delete?'}  key={'delete_button'} icon={'delete'} label={'Delete Selected'} handleClick={() => this.dispatch(deleteUserGroupsById(checkedIds))} permission={UserGroupPermissions.DELETE}/>}
            </React.Fragment>
        );
    };
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: any, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        return (
            <React.Fragment>
                <PermissionButton href={`${entity.id}/view`} hasBackground={false} icon={'visibility'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>
                {/*<PermissionTooltipButton target={`update_entity_${entity.id.toString()}`} position={'bottom'} tooltip={'Update'} href={`${entity.id}/update`} hasBackground={false} icon={'edit'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.UPDATE}/>*/}
                {hasDeleteButton && <PermissionButton hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteById()} hasBackground={false} icon={'delete'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.DELETE}/>}
            </React.Fragment>
        );
    };
    currentItem: IUserGroup = null;
    isCurrentItem: (userGroup: IUserGroup) => boolean;
    dispatch: AppDispatch = null;
    deletingEntitiesState: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    constructor(userGroups: any[], dispatch: AppDispatch, currentUserGroup?: IUserGroup, deletingEntitiesState?: API_REQUEST_STATE) {
        super();
        let userGroupInstances = [];
        for(let i = 0; i < userGroups.length; i++){
            userGroupInstances.push(new UserGroup({...userGroups[i], dispatch}));
        }
        this.dispatch = dispatch;
        this.deletingEntitiesState = deletingEntitiesState;
        this.entities = [...userGroupInstances];
        if(currentUserGroup){
            this.currentItem = currentUserGroup;
            this.isCurrentItem = (userGroup: IUserGroup) => {return userGroup.id === this.currentItem.groupId};
        }
    }

    search(userGroup: IUserGroup, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkName = userGroup.name ? userGroup.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        let checkDescription = userGroup.description ? userGroup.description.toLowerCase().indexOf(searchValue) !== -1 : false;
        // @ts-ignore
        const components = userGroup.components.map(component => component.name).join(', ');
        let checkComponent = components ? components.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkName || checkDescription || checkComponent;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'name':
                this.entities = this.entities.sort((a: IUserGroup, b: IUserGroup) => {
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

export default UserGroups;