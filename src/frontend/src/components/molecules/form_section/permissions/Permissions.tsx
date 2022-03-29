import React, {FC, useState} from 'react';
import {withTheme} from 'styled-components';
import {ComponentProps, PERMISSION_TYPES, PermissionProps, PermissionsProps} from './interfaces';
import { PermissionsStyled } from './styles';
import {removeFromArrayByValue} from "../../../utils";
import Input from "../../../atoms/input/Input";
import {Text} from "@atom/text/Text";
import {OptionProps} from "@atom/input/select/interfaces";
import {capitalize} from "../../../../utils";

export function getAllPermissions() : PERMISSION_TYPES[]{
    let permissions : PERMISSION_TYPES[] = [];
    for (let item in PERMISSION_TYPES) {
        permissions.push(item as PERMISSION_TYPES);
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
        const check = (component: OptionProps, permissionType: PERMISSION_TYPES, value: boolean, curPermissions: any = null) => {
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
        const toggleCheck = (component: OptionProps, permissionType: PERMISSION_TYPES, value: boolean) => {
            onChange(check(component, permissionType, value));
        }

        const toggleAllByPermissionType = (permissionType: PERMISSION_TYPES) => {
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
        const isAllCheckedByPermissionType = (permissionType: PERMISSION_TYPES) => {
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
                                    {allPermissionTypes.map((permissionType: PERMISSION_TYPES) => {
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