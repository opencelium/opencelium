/*
 * Copyright (C) <2021>  <becon GmbH>
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
import Input from '@basic_components/inputs/Input';

import styles from '@themes/default/general/change_component.scss';
import {FormElement} from "@decorators/FormElement";
import Checkbox from "@basic_components/inputs/Checkbox";


/**
 * Component for Secret Input
 */
@FormElement()
class FormSecretInput extends Component{

    constructor(props){
        super(props);

        this.state = {
            isVisibleText: false,
        };
    }

    /**
     * to manage secret text
     */
    manageSecret(){
        this.setState({isVisibleText: !this.state.isVisibleText});
    }

    /**
     * to handle input value
     */
    handleInput(value){
        const {name} = this.props.data;
        const {entity, updateEntity} = this.props;
        entity[name] = value;
        updateEntity(entity, name);
    }

    render(){
        const {name, label, icon, maxLength, required, tourStep, error} = this.props.data;
        const {entity} = this.props;
        let type = 'password';
        let value = entity[name];
        if(this.state.isVisibleText){
            type = 'text';
        }
        let tourClassName = '';
        if(tourStep){
            tourClassName = tourStep;
        }
        return (
            <div className={`${styles.input_secret} ${tourClassName}`}>
                <Input
                    error={error}
                    onChange={(a) => this.handleInput(a)}
                    name={name}
                    id={'input_'+name}
                    label={label}
                    type={type}
                    icon={icon}
                    maxLength={maxLength}
                    value={value}
                    required={required}
                />
                <Checkbox
                    id={`input_check_${name}`}
                    checked={this.state.isVisibleText}
                    onChange={() => this.manageSecret()}
                    inputClassName={styles.check}
                />
            </div>
        );
    }
}

FormSecretInput.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormSecretInput;