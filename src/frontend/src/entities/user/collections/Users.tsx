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
import {ListProp} from "@application/interfaces/IListCollection";
import {AppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {deleteUsersById, uploadUserImage} from "../redux-toolkit/action_creators/UserCreators";
import User from "../classes/User";
import IAuthUser from "../interfaces/IAuthUser";
import IUser, {UserProps} from "../interfaces/IUser";
import { UserPermissions } from "../constants";
import Gravatar from "react-gravatar";


export default class Users extends ListCollection<UserProps>{
    entities: IUser[];
    title = [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'Users'}];
    keyPropName: UserProps = 'id';
    sortingProps: UserProps[] = ['email'];
    listProps: ListProp<UserProps>[] = [{propertyKey: 'email', width: '40%'}, {propertyKey: 'userGroup.name', width: '40%'}];
    gridProps = {
        title: (user: IUser) => {return user.getFullName();},
        subtitle: 'email',
        getImageComponent: (user: IUser) => {return (
            <Gravatar
                email={user.email}
                size={80}
                rating="pg"
                default="mm"
                title={'avatar'}
                style={{cursor: 'pointer', borderRadius: '2px'}}
                protocol="https://"
            />
        )},
    };
    translations = {
        email: 'Email',
        userGroupName: 'Group',
    };
    getTopActions = (viewType: ViewType, checkedIds: number[] = []) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <PermissionButton key={'add_button'} autoFocus={!hasSearch} icon={'add'} href={'add'} label={'Add User'} permission={UserPermissions.CREATE}/>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedIds.length === 0} hasConfirmation confirmationText={'Do you really want to delete?'}  key={'delete_button'} icon={'delete'} label={'Delete Selected'} handleClick={() => this.dispatch(deleteUsersById(checkedIds))} permission={UserPermissions.DELETE}/>}
            </React.Fragment>
        );
    };
    uploadImage = (entity: any, image: any) => {
        this.dispatch(uploadUserImage({email: entity.email, image}));
    }
    currentItem: IAuthUser = null;
    isCurrentItem: (user: IUser) => boolean;
    dispatch: AppDispatch = null;
    deletingEntitiesState: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;
    uploadingImage: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    constructor(users: any[], dispatch: AppDispatch, currentUser?: IAuthUser, deletingEntitiesState?: API_REQUEST_STATE, uploadingImage?: API_REQUEST_STATE) {
        super();
        let userInstances = [];
        for(let i = 0; i < users.length; i++){
            userInstances.push(new User({...users[i], dispatch}));
        }
        this.dispatch = dispatch;
        this.deletingEntitiesState = deletingEntitiesState;
        this.uploadingImage = uploadingImage;
        this.entities = [...userInstances];
        if(currentUser){
            this.currentItem = currentUser;
            this.isCurrentItem = (user: IUser) => {return user.id === this.currentItem.id};
        }
    }

    search(user: IUser, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkEmail = user.email ? user.email.toLowerCase().indexOf(searchValue) !== -1 : false;
        // @ts-ignore
        let checkGroupName = user.userGroup && user.userGroup.name ? user.userGroup.name.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkEmail || checkGroupName;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'email':
                this.entities = this.entities.sort((a: IUser, b: IUser) => {
                    if(sortingType === SortType.asc){
                        return this.asc(a.email, b.email);
                    } else{
                        return this.desc(a.email, b.email);
                    }
                })
                break;
        }
    }
}