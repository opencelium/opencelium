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
import {UserGroupListProps} from "./interfaces";
import UserGroups from "@collection/UserGroups";
import {UserGroup} from "@class/usergroup/UserGroup";
import {CollectionView} from "@organism/collection_view/CollectionView";
import {useAppDispatch} from "../../../hooks/redux";
import {getAllUserGroups} from "@action/UserGroupCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {UserGroupPermissions} from "@constants/permissions";
import {permission} from "../../../decorators/permission";
import {Auth} from "@class/application/Auth";

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