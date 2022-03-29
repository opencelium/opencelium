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