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
import {useAppDispatch} from "@application/utils/redux";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@application/utils/permission";
import {Auth} from "@application/classes/Auth";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import UserGroups from "../../collections/UserGroups";
import {UserGroup} from "../../classes/UserGroup";
import {getAllUserGroups} from "../../redux_toolkit/action_creators/UserGroupCreators";
import { UserGroupPermissions } from '../../constants';
import {UserGroupListProps} from "./interfaces";

const UserGroupList: FC<UserGroupListProps> = permission(UserGroupPermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {authUser} = Auth.getReduxState();
    const {gettingUserGroups, userGroups, deletingUserGroupsById} = UserGroup.getReduxState();
    useEffect(() => {
        dispatch(getAllUserGroups());
    }, [])
    const CUserGroups = new UserGroups(userGroups, dispatch, authUser?.userGroup || null, deletingUserGroupsById);
    return (
        <CollectionView collection={CUserGroups} isLoading={gettingUserGroups === API_REQUEST_STATE.START} componentPermission={UserGroupPermissions}/>
    )
})

UserGroupList.defaultProps = {
}

export {
    UserGroupList,
};