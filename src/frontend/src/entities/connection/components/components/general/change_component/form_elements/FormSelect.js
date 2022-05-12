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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Select from '@entity/connection/components/components/general/basic_components/inputs/Select';
import {FormElement} from "@entity/connection/components/decorators/FormElement";


/**
 * Component for Select Form
 */
@FormElement()
class FormSelect extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
        };
    }

    /**
     * to focus on select form
     */
    onFocus(e){
        if(this.props.onFocus){
            this.props.onFocus(e);
        }
        this.setState({focused: true});
    }

    /**
     * to blur from select form
     */
    onBlur(e){
        if(this.props.onBlur){
            this.props.onBlur(e);
        }
        this.setState({focused: false});
    }

    /**
     * to change select form
     */
    handleChange(value){
        const {name, callback} = this.props.data;
        const {entity, updateEntity} = this.props;
        entity[name] = value.hasOwnProperty('value') ? value.value : value;
        updateEntity(entity, name);
        if(typeof callback === 'function'){
            callback(value);
        }
    }

    getValue(){
        const {source, name} = this.props.data;
        const {entity, value} = this.props;
        if(value && value.hasOwnProperty('label') && value.hasOwnProperty('value')){
            return value;
        }
        return source.find(s => s.value === entity[name]);
    }

    render(){
        const {focused} = this.state;
        const {icon, source, name, placeholder, selectClassName, tourStep, tourStepHint, label, required, error, readonly} = this.props.data;
        const {id, handleChange, hasHintTour, isDisabled} = this.props;
        let value = this.getValue();
        return (
            <Select
                id={id}
                error={error}
                className={selectClassName ? selectClassName : ''}
                name={name}
                value={value}
                onChange={handleChange ? handleChange : (a) => this.handleChange(a)}
                onFocus={(a) => this.onFocus(a)}
                onBlur={(a) => this.onBlur(a)}
                options={source}
                closeOnSelect={false}
                placeholder={placeholder}
                maxMenuHeight={200}
                minMenuHeight={50}
                isDisabled={isDisabled || readonly}
                iconTooltip={value && value.hasOwnProperty('hint') ? value.hint : ''}
                icon={icon}
                isFocused={focused}
                label={label}
                required={required}
                tourStep={tourStep}
                tooltipTourStep={hasHintTour ? tourStepHint : ''}
            />
        );
    }
}

FormSelect.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    value: PropTypes.object,
};

FormSelect.defaultProps = {
    value: null,
    onFocus: null,
    onBlur: null,
    hasHintTour: false,
    handleChange: null,
    id: 'input_'
};


export default FormSelect;