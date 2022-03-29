import {IUser} from "@interface/user/IUser";
import React from "react";
import ListCollection from "../classes/application/ListCollection";
import {SortType} from "@organism/collection_view/interfaces";
import {User} from "@class/user/User";
import {ListProp} from "@interface/application/IListCollection";
import {AppDispatch} from "@store/store";
import {UserPermissions} from "@constants/permissions";
import {PermissionButton} from "@atom/button/PermissionButton";
import {IAuthUser} from "@interface/user/IAuthUser";
import {ViewType} from "@organism/collection_view/CollectionView";
import {deleteUsersById, uploadUserImage} from "@action/UserCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";


class Users extends ListCollection{
    entities: IUser[];
    title = [{name: 'Admin Cards', link: '/admin_cards'}, {name: 'Users'}];
    keyPropName = 'id';
    sortingProps = ['email'];
    listProps: ListProp[] = [{propertyKey: 'email', width: '40%'}, {propertyKey: 'userGroup.name', width: '40%'}];
    gridProps = {
        title: (user: IUser) => {return user.getFullName();},
        subtitle: 'email',
        //image: (user: IUser) => {return user.userDetail.profilePicture;},
    };
    translations = {
        email: 'Email',
        userGroupName: 'Name',
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

export default Users;