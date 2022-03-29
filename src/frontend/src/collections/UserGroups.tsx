import React from "react";
import ListCollection from "../classes/application/ListCollection";
import {IUserGroup} from "@interface/usergroup/IUserGroup";
import {UserGroup} from "@class/usergroup/UserGroup";
import {SortType} from "@organism/collection_view/interfaces";
import {ListProp} from "@interface/application/IListCollection";
import {AppDispatch} from "@store/store";
import {PermissionButton} from "@atom/button/PermissionButton";
import {UserGroupPermissions} from "@constants/permissions";
import {ViewType} from "@organism/collection_view/CollectionView";
import {deleteUserGroupsById} from "@action/UserGroupCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";

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