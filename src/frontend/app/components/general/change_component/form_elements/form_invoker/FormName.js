/*
 * Copyright (C) <2019>  <becon GmbH>
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
import Input from '../../../basic_components/inputs/Input';

import styles from '../../../../../themes/default/general/change_component.scss';
import {FormElement} from "../../../../../decorators/FormElement";

/**
 * Component for Form Input
 */
@FormElement()
class FormName extends Component{

    constructor(props){
        super(props);
        this.state = {
            name: props.entity.name,
        };
    }

    onBlur(){
        const {name} = this.state;
        let {entity, updateEntity} = this.props;
        entity.name = name;
        updateEntity(entity);
    }

    handleInput(name){
        this.setState({name});
    }

    render(){
        const {name} = this.state;
        const {label, icon, maxLength, readOnly, required} = this.props.data;
        let {tourStep} = this.props.data;
        let isReadonly = false;
        let inputStyle = styles.form_input;
        if(tourStep){
            inputStyle += ' ' + tourStep;
        }
        if(readOnly){
            isReadonly = true;
        }
        return (
            <Input
                onChange={::this.handleInput}
                onBlur={::this.onBlur}
                name={'form_connector_name'}
                label={label}
                type={'text'}
                icon={icon}
                maxLength={maxLength}
                value={name}
                readOnly={isReadonly}
                className={inputStyle}
                required={required}
                theme={{label: styles.form_input_label}}
            />
        );
    }
}

FormName.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormName;