

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

import React, { Component } from 'react';

import {ErrorPermissions} from "@utils/constants/errors";
import {NO_NEED_PERMISSION} from "@utils/constants/permissions";
import {NoPermission} from "@molecule/no_permission/NoPermission";

/**
 * check the component on the permission
 *
 * @param comingPermission
 * @param withNoPermissionFeedback - if user does not have permissions and withNoPermissionsFeedback true returns null
 * returns the same component if the auth user has right permission otherwise returns NoPermission
 */
export function permission(comingPermission = '', withNoPermissionFeedback = false){
    return function (Component) {
        return (props) => {
            let checkPermission = comingPermission;
            if(checkPermission === ''){
                if(props.hasOwnProperty('permission')){
                    checkPermission = props.permission;
                }
            }
            let usersPermissions = getAuthUserPermissions(props);
            if(hasPermissions(checkPermission, usersPermissions)){
                return <Component {...props}/>;
            } else{
                if(withNoPermissionFeedback){
                    return <NoPermission />;
                }
            }
            return null;
        };
    };
}

/**
 *
 * @param props of the component
 * @returns {Array}
 */
function getAuthUserPermissions(props){
    let permissions = [];
    if(props.authUser){
        if(props.authUser.hasOwnProperty('userGroup')){
            if(props.authUser.userGroup.hasOwnProperty('components')){
                permissions = props.authUser.userGroup.components.map(component => {return {entity: component.name, permissions: component.permissions};});
            }
        }
    }
    if(typeof props.authUser === 'undefined'){
        console.error(ErrorPermissions.AUTH_USER_ABSENT);
    }
    return permissions;
}

/**
 *
 * @param comingPermission
 * @param userPermissions
 * @returns {boolean}
 */
function hasPermissions(comingPermission, userPermissions){
    if(comingPermission === NO_NEED_PERMISSION){
        return true;
    }
    let result = false;
    if(comingPermission === '' || userPermissions.length === 0){
        return result;
    }
    let permissionIndex = userPermissions.findIndex(permission => comingPermission.entity === permission.entity);
    if(permissionIndex !== -1){
        let foundPermission = userPermissions[permissionIndex].permissions.findIndex(permission => permission === comingPermission.permission);
        if(foundPermission !== -1){
            result = true;
        }
    }
    return result;
}