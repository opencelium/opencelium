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

import React, {FC, useEffect} from 'react';
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@entity/application/utils/permission";
import {Auth} from "@application/classes/Auth";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import {UserListProps} from "./interfaces";
import Users from "../../collections/Users";
import User from "../../classes/User";
import {getAllUsers} from "../../redux-toolkit/action_creators/UserCreators";
import { UserPermissions } from '../../constants';

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

export default UserList;