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

import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {capitalize, removeFromArrayByValue} from "@application/utils/utils";
import Input from "@app_component/base/input/Input";
import {Text} from "@app_component/base/text/Text";
import {OptionProps} from "@app_component/base/input/select/interfaces";
import {PermissionTypes} from "@application/requests/models/Component";
import {PermissionProps, PermissionsProps} from './interfaces';
import { PermissionsStyled } from './styles';

export function getAllPermissions() : PermissionTypes[]{
    let permissions : PermissionTypes[] = [];
    for (let item in PermissionTypes) {
        permissions.push(item as PermissionTypes);
    }
    return [...permissions];
}

const Permissions: FC<PermissionsProps> =
    ({
        id,
        placeholder,
        required,
        label,
        icon,
        error,
        isLoading,
        isIconInside,
        readOnly,
        permissions,
        components,
        onChange,
     }) => {
        const allPermissionTypes = getAllPermissions();
        const getPermissions = () => {
            let newPermissions: PermissionProps = {};
            for(let param in permissions){
                newPermissions[param] = [...permissions[param]];
            }
            return newPermissions;
        }
        const check = (component: OptionProps, permissionType: PermissionTypes, value: boolean, curPermissions: any = null) => {
            let checkedPermissions = curPermissions === null ? getPermissions() : curPermissions;
            if(checkedPermissions[component.label]){
                if(value){
                    if(checkedPermissions[component.label].findIndex((element: any) => element === permissionType) === -1) {
                        checkedPermissions[component.label].push(permissionType);
                    }
                } else{
                    checkedPermissions[component.label] = [...removeFromArrayByValue(checkedPermissions[component.label], permissionType)];
                }
            } else{
                checkedPermissions[component.label] = [permissionType];
            }
            return checkedPermissions;
        }
        const toggleCheck = (component: OptionProps, permissionType: PermissionTypes, value: boolean) => {
            onChange(check(component, permissionType, value));
        }

        const toggleAllByPermissionType = (permissionType: PermissionTypes) => {
            let newValue = !isAllCheckedByPermissionType(permissionType);
            let newPermissions = getPermissions();
            for(let i = 0; i < components.length; i++){
                newPermissions = check(components[i], permissionType, newValue, newPermissions);
            }
            onChange(newPermissions);
        }
        const toggleAllByComponent = (component: OptionProps) => {
            let newPermissions = getPermissions();
            if(newPermissions[component.label].length < allPermissionTypes.length){
                newPermissions[component.label] = allPermissionTypes;
            } else{
                newPermissions[component.label] = [];
            }
            onChange(newPermissions);
        }
        const toggleAll = () => {
            let newPermissions = getPermissions();
            let newResult = isAllChecked() ? [] : allPermissionTypes;
            for(let i = 0; i < components.length; i++){
                newPermissions[components[i].label] = [...newResult];
            }
            onChange(newPermissions);
        }
        const isAllChecked = () => {
            let result = false;
            let allPermissionKeys = Object.keys(permissions);
            if(allPermissionKeys.length < components.length){
                result = false;
            } else{
                for(let i = 0; i < components.length; i++){
                    if(permissions[components[i].label] && permissions[components[i].label].length !== allPermissionTypes.length){
                        break;
                    }
                    if(i === components.length - 1){
                        result = true;
                    }
                }
            }
            return result;
        }
        const isAllCheckedByPermissionType = (permissionType: PermissionTypes) => {
            let result = false;
            let allPermissionKeys = Object.keys(permissions);
            if(allPermissionKeys.length < components.length){
                result = false;
            } else{
                for(let i = 0; i < components.length; i++) {
                    if(!permissions[components[i].label] || permissions[components[i].label].findIndex(elem => elem === permissionType) === -1){
                        break;
                    }
                    if(i === components.length - 1){
                        result = true;
                    }
                }
            }
            return result;
        }
        const hasLabel = label !== '';
        return (
            <Input labelMargin={'-18px 0 0'} paddingTop={'0'} paddingBottom={'20px'} readOnly={readOnly} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
                <PermissionsStyled hasLabel={hasLabel}>
                    <thead>
                        <tr>
                            <th/>
                            {allPermissionTypes.map((permissionType, key) => {
                                return (
                                    <th key={permissionType}>
                                        <span>
                                            <Text transKey={`permissions.${permissionType}`}/>
                                            {!readOnly && <input id={key === 0 ? id : ''} type={'checkbox'} checked={isAllCheckedByPermissionType(permissionType)} onChange={() => toggleAllByPermissionType(permissionType)}/>}
                                        </span>
                                    </th>
                                )
                            })}
                            {!readOnly &&
                                <th>
                                    <span>
                                        <Text transKey={`permissions.ADMIN`}/>
                                        <input type={'checkbox'} checked={isAllChecked()} onChange={toggleAll}/>
                                    </span>
                                </th>
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {components.map(component => {
                            const componentPermissions = permissions[component.label] || [];
                            return(
                                <tr key={component.value}>
                                    <td><Text value={capitalize(component.label.toLowerCase())}/></td>
                                    {allPermissionTypes.map((permissionType: PermissionTypes) => {
                                        return (
                                            <td key={`${component.value}_${permissionType}`}>
                                                {readOnly
                                                    ?
                                                        componentPermissions.findIndex(elem => elem === permissionType) !== -1
                                                        ?
                                                            <Text value={'+'}/>
                                                        :
                                                            <Text value={'-'}/>
                                                    :
                                                        <input
                                                            type={'checkbox'}
                                                            checked={componentPermissions.findIndex(elem => elem === permissionType) !== -1}
                                                            onChange={() => toggleCheck(component, permissionType, !(componentPermissions.findIndex(elem => elem === permissionType) !== -1))}
                                                        />
                                                }
                                            </td>
                                        );
                                    })}
                                    {!readOnly &&
                                        <td>
                                            <input type={'checkbox'} checked={permissions[component.label].length === allPermissionTypes.length} onChange={() => toggleAllByComponent(component)}/>
                                        </td>
                                    }
                                </tr>
                            )
                        })}
                    </tbody>
                </PermissionsStyled>
            </Input>
        )
    }

Permissions.defaultProps = {
}


export {
    Permissions,
};

export default withTheme(Permissions);