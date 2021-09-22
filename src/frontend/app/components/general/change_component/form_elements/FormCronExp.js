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
import {checkCronExpression, isString} from "@utils/app";
import CronExpGenerator from "@components/content/schedules/CronExpGenerator";

/**
 * Component for Form Input
 */
@FormElement()
class FormCronExp extends Component{

    constructor(props){
        super(props);
    }

    handleInput(value){
        const {name, validateOnChange} = this.props.data;
        const {entity, updateEntity} = this.props;
        if((typeof validateOnChange === 'function' && validateOnChange(value))
            || typeof validateOnChange !== 'function'){
            entity[name] = value;
            updateEntity(entity, name);
        }
    }

    render(){
        const {name, label, icon, maxLength, readonly, required, error, isLoading, value, className} = this.props.data;
        const {entity} = this.props;
        let {type, tourStep} = this.props.data;
        let multiline = false;
        let isReadonly = false;
        let inputStyle = styles.form_input;
        if(tourStep){
            inputStyle += ' ' + tourStep;
        }
        if(className){
            inputStyle += ` ${className}`;
        }
        if(type === 'textarea'){
            type = 'text';
            multiline = true;
            inputStyle += ' ' + styles.form_input_textarea;
        }
        if(readonly){
            isReadonly = true;
        }
        let inputValue = isString(value) ? value : entity[name];
        return (
            <div style={{position: 'relative'}}>
                <Input
                    isLoading={isLoading}
                    error={error}
                    onChange={::this.handleInput}
                    name={name}
                    id={'input_'+name}
                    label={label}
                    type={type}
                    icon={icon}
                    maxLength={maxLength}
                    value={inputValue}
                    multiline={multiline}
                    rows={4}
                    readOnly={isReadonly}
                    className={inputStyle}
                    required={required}
                    theme={{label: styles.form_input_label}}
                />
                <CronExpGenerator changeCronExp={::this.handleInput}/>
            </div>
        );
    }
}

FormCronExp.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormCronExp;