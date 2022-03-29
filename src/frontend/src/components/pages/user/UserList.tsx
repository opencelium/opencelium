import React, {FC, useEffect} from 'react';
import {UserListProps} from "./interfaces";
import Users from "@collection/Users";
import {User} from "@class/user/User";
import {CollectionView} from "@organism/collection_view/CollectionView";
import {useAppDispatch} from "../../../hooks/redux";
import {getAllUsers} from "@action/UserCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {permission} from "../../../decorators/permission";
import {UserPermissions} from "@constants/permissions";
import {Auth} from "@class/application/Auth";

const UserList: FC<UserListProps> = permission(UserPermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {authUser} = Auth.getReduxState();
    const {gettingUsers, users, deletingUsersById, uploadingUserImage} = User.getReduxState();
    useEffect(() => {
        dispatch(getAllUsers());
    }, [])
    const CUsers = new Users(users, dispatch, authUser || null, deletingUsersById, uploadingUserImage);
    return (
        <CollectionView collection={CUsers} isLoading={gettingUsers === API_REQUEST_STATE.START} componentPermission={UserPermissions}/>
    )
})

UserList.defaultProps = {
}

export {
    UserList,
};