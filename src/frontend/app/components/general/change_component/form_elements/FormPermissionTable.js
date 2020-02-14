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
import {Table, TableHead, TableRow, TableCell} from 'react-toolbox/lib/table';
import {Permissions} from '../../../../utils/constants/app';
import theme from "react-toolbox/lib/input/theme.css";

import styles from '../../../../themes/default/general/change_component.scss';
import {FormElement} from "../../../../decorators/FormElement";
import FontIcon from "../../basic_components/FontIcon";
import Checkbox from "../../basic_components/inputs/Checkbox";


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
                        permissionCheckValues[j] = permissionCheckValues[j] & false;
                    }
                } else {
                    if (tmpValuesLength === 4) {
                        componentAdminValues.push(true);
                        permissionCheckValues[4] = permissionCheckValues[4] & true;
                    } else {
                        componentAdminValues.push(false);
                        permissionCheckValues[4] = permissionCheckValues[4] & false;
                    }
                    for (let j = 0; j < Permissions.length; j++) {
                        let ind = values[components[i].label].indexOf(Permissions[j]);
                        if (ind > -1) {
                            permissionCheckValues[j] = permissionCheckValues[j] & true;
                        } else {
                            permissionCheckValues[j] = permissionCheckValues[j] & false;
                        }
                    }
                }
            } else{
                componentAdminValues.push(false);
                for(let j = 0; j < permissionCheckValues.length; j++){
                    permissionCheckValues[j] = permissionCheckValues[j] & false;
                }
            }
        }

        let iconStyle = theme.icon;
        let labelStyle = theme.label;
        if(this.state.focused){
            iconStyle += ' ' + styles.multiselect_focused;
            labelStyle += ' ' + styles.multiselect_focused;
        }
        return (
            <div className={`${theme.withIcon} ${theme.input} ${tourStep ? tourStep : ''}`} onMouseOver={::this.onMouseOver} onMouseLeave={::this.onMouseLeave}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                <div className={styles.permission_table}>
                    <Table selectable={false} className={styles.user_group_table}>
                        <TableHead>
                            <TableCell><span/></TableCell>
                            {
                                Permissions.map((permission, key) => (
                                    <TableCell key={key} className={styles.header_cell}>
                                        <span>{t(`PERMISSIONS.${permission}`)}</span>
                                        <Checkbox
                                            id={key === 0 ? `input_${name}` : ''}
                                            checked={permissionCheckValues[key]}
                                            onChange={(e) => ::this.checkAllByPermission(e, permission)}
                                            theme={{field: styles.checkbox_field}}
                                        />
                                    </TableCell>
                                ))
                            }
                            <TableCell className={styles.header_cell}>
                                <span>{t(`PERMISSIONS.ADMIN`)}</span>
                                <Checkbox
                                    checked={permissionCheckValues[4]}
                                    onChange={::this.checkAll}
                                    theme={{field: styles.checkbox_field}}
                                />
                            </TableCell>
                        </TableHead>
                        {components.map((component, key) => {
                            return (
                                <TableRow key={key}>
                                    <TableCell>{component.label}</TableCell>
                                    {
                                        Permissions.map((permission, key2) => {
                                            let checkValue = false;
                                            if(values.hasOwnProperty(component.label)){
                                                if(values[component.label].indexOf(permission) > -1){
                                                    checkValue = true;
                                                }
                                            }
                                            return (
                                                <TableCell key={key2} className={styles.row_cell}>
                                                    <Checkbox
                                                        checked={checkValue}
                                                        onChange={(e) => ::this.setPermission(e, component, permission)}
                                                        theme={{field: styles.checkbox_field_value}}
                                                    />
                                                </TableCell>
                                            );
                                        })
                                    }
                                    <TableCell className={styles.row_cell}>
                                        <Checkbox
                                            checked={componentAdminValues[key]}
                                            onChange={(e) => ::this.checkAllByComponent(e, component)}
                                            theme={{field: styles.checkbox_field_value}}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </Table>
                </div>
                <FontIcon value={icon} className={iconStyle}/>
                <span className={theme.bar}/>
                <label className={labelStyle}>{label}</label>
            </div>
        );
    }
}

FormPermissionTable.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

export default FormPermissionTable;