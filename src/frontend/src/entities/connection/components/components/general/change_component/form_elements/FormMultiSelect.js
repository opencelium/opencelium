/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import {FormElement} from "@entity/connection/components/decorators/FormElement";
import Select from "@entity/connection/components/components/general/basic_components/inputs/Select";
import ToolboxThemeInput from "../../../../hocs/ToolboxThemeInput";


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
        const {name, callback} = this.props.data;
        const {entity, updateEntity} = this.props;
        entity[name] = value;
        updateEntity(entity, name);
        if(typeof callback === 'function'){
            callback(value);
        }
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
        let labelStyle = '';
        if(this.state.focused){
            labelStyle += ' ' + styles.multiselect_focused;
        }
        if(typeof required !== 'boolean'){
            required = false;
        }
        if(!required){
            return <label className={labelStyle}>{label}</label>;
        }
        return <span className={labelStyle}>{label}</span>;
    }
    
    render(){
        const {icon, source, name, placeholder, tourStep, error, readonly} = this.props.data;
        const {entity} = this.props;
        let value = entity[name];
        let iconClassName = '';
        let selectStyle = styles.multiselect;
        if(this.state.focused){
            iconClassName = styles.icon_focused;
            selectStyle = styles.multiselect_focused;
        }
        return (
            <ToolboxThemeInput
                icon={icon}
                tourStep={tourStep}
                label={this.renderLabel()}
                iconClassName={iconClassName}
            >
                <Select
                    id={`input_${name}`}
                    isDisabled={readonly}
                    error={error}
                    name={name}
                    value={value}
                    onChange={(a) => this.handleChange(a)}
                    onFocus={(a) => this.onFocus(a)}
                    onBlur={(a) => this.onBlur(a)}
                    options={source}
                    isMulti
                    closeOnSelect={false}
                    placeholder={placeholder}
                    className={selectStyle}
                />
            </ToolboxThemeInput>
        );
    }
}

FormMultiSelect.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

export default FormMultiSelect;