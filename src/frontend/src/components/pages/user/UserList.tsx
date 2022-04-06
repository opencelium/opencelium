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