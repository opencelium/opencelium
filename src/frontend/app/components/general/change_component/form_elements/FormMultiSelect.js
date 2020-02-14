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
import theme from "react-toolbox/lib/input/theme.css";
import styles from '../../../../themes/default/general/change_component.scss';
import {FormElement} from "../../../../decorators/FormElement";
import OCSelect from "../../basic_components/inputs/Select";
import FontIcon from "../../basic_components/FontIcon";


/**
 * Component for Form MultiSelect
 */
@FormElement()
class FormMultiSelect extends Component{

    constructor(props){
        super(props);

        this.state = {
            focused: false,
        };
    }

    /**
     * to change multi select value
     */
    handleChange(value){
        const {name} = this.props.data;
        const {entity, updateEntity} = this.props;
        entity[name] = value;
        updateEntity(entity);
    }

    /**
     * to focus on multiselect
     */
    onFocus(e){
        this.setState({focused: true});
    }

    /**
     * to blur from multiselect
     */
    onBlur(e){
        this.setState({focused: false});
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
    
    render(){
        const {icon, source, name, placeholder, tourStep} = this.props.data;
        const {entity} = this.props;
        let value = entity[name];
        let iconStyle = theme.icon;
        let selectStyle = styles.multiselect;
        if(this.state.focused){
            iconStyle += ' ' + styles.multiselect_focused;
            selectStyle = styles.multiselect_focused;
        }
        return (
            <div className={`${theme.withIcon} ${theme.input} ${tourStep ? tourStep : ''}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                <OCSelect
                    id={`input_${name}`}
                    name={name}
                    value={value}
                    onChange={::this.handleChange}
                    onFocus={::this.onFocus}
                    onBlur={::this.onBlur}
                    options={source}
                    isMulti
                    closeOnSelect={false}
                    placeholder={placeholder}
                    className={selectStyle}
                />
                <FontIcon value={icon} className={iconStyle}/>
                <span className={theme.bar}/>
                {this.renderLabel()}
            </div>
        );
    }
}

FormMultiSelect.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

export default FormMultiSelect;