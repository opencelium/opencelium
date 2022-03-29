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
import InputText from "@atom/input/text/InputText";

import styles from '@themes/default/general/change_component.scss';
import {FormElement} from "@decorators/FormElement";
import Input from "@basic_components/inputs/Input";

/**
 * Component for Form Input
 */
@FormElement()
class FormTitle extends Component{

    constructor(props){
        super(props);

        this.state = {
            title: props.entity.title,
        };
    }

    onBlur(){
        const {title} = this.state;
        let {entity, updateEntity} = this.props;
        entity.title = title;
        updateEntity(entity, 'title');
    }

    handleInput(title){
        if(typeof this.props.clearValidationMessage === 'function'){
            this.props.clearValidationMessage(this.props.data.name);
        }
        this.setState({title});
    }

    render(){
        const {title} = this.state;
        const {name, label, icon, maxLength, readOnly, required, error} = this.props.data;
        let {tourStep} = this.props.data;
        let isReadonly = false;
        let inputStyle = styles.form_input;
        if(tourStep){
            inputStyle += ' ' + tourStep;
        }
        if(readOnly){
            isReadonly = true;
        }
        return <InputText
            error={error}
            onChange={(e) => this.handleInput(e.target.value)}
            onBlur={(a) => this.onBlur(a)}
            name={'form_connection_title'}
            id={'input_'+name}
            label={label}
            icon={icon}
            maxLength={maxLength}
            value={title}
            readOnly={isReadonly}
            required={required}
        />;
        return (
            <Input
                error={error}
                onChange={(a) => this.handleInput(a)}
                onBlur={(a) => this.onBlur(a)}
                name={'form_connection_title'}
                id={'input_'+name}
                label={label}
                type={'text'}
                icon={icon}
                maxLength={maxLength}
                value={title}
                readOnly={isReadonly}
                className={inputStyle}
                required={required}
                theme={{label: styles.form_input_label, input: isReadonly ? styles.form_input_readonly_input : ''}}
            />
        );
    }
}

FormTitle.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormTitle;