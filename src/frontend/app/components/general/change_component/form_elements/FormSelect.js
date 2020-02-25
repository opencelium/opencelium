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
import Select from '../../basic_components/inputs/Select';

import theme from "react-toolbox/lib/input/theme.css";
import styles from '../../../../themes/default/general/change_component.scss';
import {FormElement} from "../../../../decorators/FormElement";
import TooltipFontIcon from "../../basic_components/tooltips/TooltipFontIcon";
import FontIcon from "../../basic_components/FontIcon";


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
        updateEntity(entity);
        if(typeof callback === 'function'){
            callback(value);
        }
    }

    renderLabel(){
        let {label, required} = this.props.data;
        let labelStyle = theme.label;
        if(this.state.focused){
            labelStyle += ' ' + styles.multiselect_focused;
        }
        if(typeof required !== 'boolean'){
            required = false;
        }
        if(!required){
            return <label className={labelStyle}>{label}</label>;
        }
        return <label className={labelStyle}>{label}<span className={theme.required}> *</span></label>;
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
        const {icon, source, name, placeholder, selectClassName, tourStep, tourStepHint} = this.props.data;
        const {id, handleChange, hasHintTour, isDisabled} = this.props;
        let value = this.getValue();
        let iconStyle = theme.icon;
        let selectStyle = styles.multiselect;
        let className = '';
        if(this.state.focused){
            iconStyle += ' ' + styles.multiselect_focused;
            //selectStyle = styles.multiselect_focused;
        }
        if(selectClassName){
            className = selectClassName;
        }
        if(tourStep){
            className += ' ' + tourStep;
        }
        return (
            <div className={`${theme.withIcon} ${theme.input} ${className}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                <Select
                    id={id}
                    name={name}
                    value={value}
                    onChange={handleChange ? handleChange : ::this.handleChange}
                    onFocus={::this.onFocus}
                    onBlur={::this.onBlur}
                    options={source}
                    closeOnSelect={false}
                    placeholder={placeholder}
                    className={selectStyle}
                    maxMenuHeight={200}
                    minMenuHeight={50}
                    isDisabled={isDisabled}
                />
                {
                    value && value.hasOwnProperty('hint')
                    ?
                        <TooltipFontIcon value={icon} tooltip={value.hint} className={`${iconStyle} ${hasHintTour ? tourStepHint : ''}`}/>
                    :
                        <FontIcon value={icon} className={iconStyle}/>
                }
                <span className={theme.bar}/>
                {this.renderLabel()}
            </div>
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