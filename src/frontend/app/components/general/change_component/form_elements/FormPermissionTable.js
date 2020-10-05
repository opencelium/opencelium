/*
 * Copyright (C) <2020>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withTranslation} from 'react-i18next';
import {Permissions} from '@utils/constants/app';

import styles from '@themes/default/general/change_component.scss';
import {FormElement} from "@decorators/FormElement";
import Checkbox from "@basic_components/inputs/Checkbox";
import {formatHtmlId} from "@utils/app";
import Table from "@basic_components/table/Table";
import ToolboxThemeInput from "../../../../hocs/ToolboxThemeInput";


/**
 * Component for Permission Table
 */
@withTranslation('app')
@FormElement()
class FormPermissionTable extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
        };
    }

    /**
     * to mouse over permission table
     */
    onMouseOver(e){
        this.setState({focused: true});
    }

    /**
     * to mouse leave from permission table
     */
    onMouseLeave(e){
        this.setState({focused: false});
    }

    /**
     * to check all permissions
     */
    checkAll(value){
        const {entity, data} = this.props;
        const {dataSource} = data;
        let components = entity[dataSource];
        for(let i = 0; i < components.length; i++){
            for(let j = 0; j < Permissions.length; j++){
                this.setPermission(value, components[i], Permissions[j]);
            }
        }
    }

    /**
     * to check all by permission
     */
    checkAllByPermission(value, permission){
        const {entity, data} = this.props;
        const {dataSource} = data;
        let components = entity[dataSource];
        for(let i = 0; i < components.length; i++){
            this.setPermission(value, components[i], permission);
        }
    }

    /**
     * to check all by component
     */
    checkAllByComponent(value, component){
        for(let i = 0; i < Permissions.length; i++){
            this.setPermission(value, component, Permissions[i]);
        }
    }

    /**
     * to set permission
     */
    setPermission(value, component, permission){
        let type = '+';
        if(!value){
            type = '-';
        }
        let componentName = component.label;
        const {name} = this.props.data;
        const {entity, updateEntity} = this.props;
        let permissions = entity[name];
        let index = -1;
        if(permissions.hasOwnProperty(componentName)){
            if (Array.isArray(permissions[componentName])){
                switch(type){
                    case '+':
                        index = permissions[componentName].indexOf(permission);
                        if(index === -1){
                            permissions[componentName].push(permission);
                        }
                        break;
                    case '-':
                        index = permissions[componentName].indexOf(permission);
                        if(index > -1) {
                            permissions[componentName].splice(index, 1);
                        }
                        break;
                }
            } else{
                if(type === '+'){
                    permissions[componentName] = [permission];
                }
            }
        } else{
            if(type === '+') {
                permissions[componentName] = [permission];
            }
        }
        entity[name] = permissions;
        updateEntity(entity);
    }

    render(){
        const {focused} = this.state;
        const {label, name, dataSource, icon, tourStep} = this.props.data;
        const {t, entity} = this.props;
        let components = entity[dataSource];
        let values = entity[name];
        let permissionCheckValues = [true, true, true, true, true];
        let componentAdminValues = [];
        for(let i = 0; i < components.length; i++){
            if(values.hasOwnProperty(components[i].label)) {
                let tmpValuesLength = values[components[i].label].length;
                if(tmpValuesLength === 0){
                    componentAdminValues.push(false);
                    for(let j = 0; j < permissionCheckValues.length; j++){
                        permissionCheckValues[j] = Boolean(permissionCheckValues[j] & false);
                    }
                } else {
                    if (tmpValuesLength === 4) {
                        componentAdminValues.push(true);
                        permissionCheckValues[4] = Boolean(permissionCheckValues[4] & true);
                    } else {
                        componentAdminValues.push(false);
                        permissionCheckValues[4] = Boolean(permissionCheckValues[4] & false);
                    }
                    for (let j = 0; j < Permissions.length; j++) {
                        let ind = values[components[i].label].indexOf(Permissions[j]);
                        if (ind > -1) {
                            permissionCheckValues[j] = Boolean(permissionCheckValues[j] & true);
                        } else {
                            permissionCheckValues[j] = Boolean(permissionCheckValues[j] & false);
                        }
                    }
                }
            } else{
                componentAdminValues.push(false);
                for(let j = 0; j < permissionCheckValues.length; j++){
                    permissionCheckValues[j] = Boolean(permissionCheckValues[j] & false);
                }
            }
        }
        return (
            <ToolboxThemeInput isFocused={focused} icon={icon} label={label} tourStep={tourStep} onMouseOver={::this.onMouseOver} onMouseLeave={::this.onMouseLeave} inputElementClassName={styles.multiselect_label}>
                <div className={styles.permission_table}>
                    <Table hover>
                        <thead>
                            <tr>
                                <th><span/></th>
                                {
                                    Permissions.map((permission, key) => (
                                        <th key={key}>
                                            <Checkbox
                                                label={t(`PERMISSIONS.${permission}`)}
                                                id={key === 0 ? `input_${formatHtmlId(name)}` : `input_${formatHtmlId(permission)}`}
                                                checked={permissionCheckValues[key]}
                                                onChange={(e) => ::this.checkAllByPermission(e.target.checked, permission)}
                                            />
                                        </th>
                                    ))
                                }
                                <th>
                                    <Checkbox
                                        label={t(`PERMISSIONS.ADMIN`)}
                                        id={'input_admin'}
                                        checked={permissionCheckValues[4]}
                                        onChange={::this.checkAll}
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {components.map((component, key) => {
                                return (
                                    <tr key={key}>
                                        <td>{component.label}</td>
                                        {
                                            Permissions.map((permission, key2) => {
                                                let checkValue = false;
                                                if(values.hasOwnProperty(component.label)){
                                                    if(values[component.label].indexOf(permission) > -1){
                                                        checkValue = true;
                                                    }
                                                }
                                                return (
                                                    <td key={key2}>
                                                        <Checkbox
                                                            id={formatHtmlId(`input_${component.label}_${permission}`)}
                                                            checked={checkValue}
                                                            onChange={(e) => ::this.setPermission(e.target.checked, component, permission)}
                                                        />
                                                    </td>
                                                );
                                            })
                                        }
                                        <td>
                                            <Checkbox
                                                id={formatHtmlId(`input_${component.label}_admin`)}
                                                checked={componentAdminValues[key]}
                                                onChange={(e) => ::this.checkAllByComponent(e.target.checked, component)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            </ToolboxThemeInput>
        );
    }
}

FormPermissionTable.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

export default FormPermissionTable;