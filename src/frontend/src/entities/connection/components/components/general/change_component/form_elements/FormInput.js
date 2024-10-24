/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Input from '@entity/connection/components/components/general/basic_components/inputs/Input';

import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import {FormElement} from "@entity/connection/components/decorators/FormElement";
import {checkCronExpression, isString} from "@application/utils/utils";
import InputText from "@app_component/base/input/text/InputText";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";

/**
 * Component for Form Input
 */
@FormElement()
class FormInput extends Component{

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
        const {name, label, icon, maxLength, readOnly, required, error, isLoading, value, className} = this.props.data;
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
        if(readOnly){
            isReadonly = true;
        }
        let inputValue = isString(value) ? value : entity[name];
        if(type === 'textarea'){
            return <InputTextarea
                error={error}
                onChange={(e) => this.handleInput(e.target.value)}
                //onBlur={(a) => this.onBlur(a)}
                name={name}
                id={'input_'+name}
                label={label}
                icon={icon}
                maxLength={maxLength}
                value={inputValue}
                readOnly={isReadonly}
                required={required}
                isLoading={isLoading}
            />
        }
        return <InputText
            error={error}
            onChange={(e) => this.handleInput(e.target.value)}
            //onBlur={(a) => this.onBlur(a)}
            name={name}
            id={'input_'+name}
            label={label}
            icon={icon}
            maxLength={maxLength}
            value={inputValue}
            readOnly={isReadonly}
            required={required}
            isLoading={isLoading}
        />;
        return (
            <Input
                isLoading={isLoading}
                error={error}
                onChange={(a) => this.handleInput(a)}
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
        );
    }
}

FormInput.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormInput;