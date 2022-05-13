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

import React, {Component, ElementType, FC} from 'react';
import IAuthUser from "@entity/user/interfaces/IAuthUser";
import {NoPermission} from "@app_component/base/no_permission/NoPermission";
import {Auth} from "../classes/Auth";
import {ComponentProps, NO_RESTRICTION, PermissionProps} from '../interfaces/IApplication';

/**
 * check the component on the permission
 *
 * @param comingPermission
 * @param withPermissionFeedback - if user does not have permissions and withNoPermissionsFeedback true returns null
 * returns the same component if the auth user has right permission otherwise returns NoPermission
 */
export function permission<T>(comingPermission: PermissionProps = null, withPermissionFeedback: boolean = true){
    return function (Component: ElementType) {
        const ComponentWithPermission: FC<T> = (props: any) => {
            const {authUser} = Auth.getReduxState();
            let usersPermissions = getAuthUserPermissions(authUser);
            if(hasPermissions(comingPermission || props?.permission || null, usersPermissions)){
                return(
                    <Component {...props}/>
                );
            } else{
                if(withPermissionFeedback){
                    return <NoPermission/>;
                }
            }
            return null;
        };
        return ComponentWithPermission;
    };
}

/**
 *
 * @param authUser - authorized user
 * @returns {Array}
 */
function getAuthUserPermissions(authUser: IAuthUser){
    let permissions = [];
    if(authUser){
        if(authUser.hasOwnProperty('userGroup')){
            if(authUser.userGroup.hasOwnProperty('components')){
                permissions = authUser.userGroup.components.map((component: ComponentProps) => {return {entity: component.name, permissions: component.permissions};});
            }
        }
    }
    return permissions;
}

/**
 *
 * @param comingPermission
 * @param userPermissions
 * @returns {boolean}
 */
function hasPermissions(comingPermission: PermissionProps, userPermissions: any[]){
    let result = false;
    if(comingPermission) {
        if(comingPermission.entity === NO_RESTRICTION.entity){
            return true;
        }
        let permissionIndex = userPermissions.findIndex((permission: PermissionProps) => comingPermission.entity === permission.entity);
        if (permissionIndex !== -1) {
            let foundPermission = userPermissions[permissionIndex].permissions.findIndex((permission: string) => permission === comingPermission.name);
            if (foundPermission !== -1) {
                result = true;
            }
        }
    }
    return result;
}