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

import {FormElement} from "@entity/connection/components/decorators/FormElement";
import Select from "@entity/connection/components/components/general/basic_components/inputs/Select";
import CNotification from "@entity/connection/components/classes/components/content/schedule/notification/CNotification";

/**
 * Component for Form Input
 */
@FormElement()
class FormType extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
        };
    }

    /**
     * to focus on select
     */
    focusSelect(){
        this.setState({focused: true});
    }

    /**
     * to blur from select
     */
    blurSelect(){
        this.setState({focused: false});
    }

    handleChange(type){
        let {entity, updateEntity} = this.props;
        entity.setTypeFromSelect(type);
        updateEntity(entity, 'type');
    }

    render(){
        const {focused} = this.state;
        const {entity, data} = this.props;
        const {name, label, icon, readOnly, required, placeholder, t, error} = data;
        let {tourStep} = this.props.data;
        let isReadonly = false;
        if(readOnly){
            isReadonly = true;
        }
        const value = CNotification.getNotificationTypeForSelect(entity.type, {translate: t});
        const options = CNotification.getAllNotificationTypesForSelect(t);
        return(
            <Select
                id={`input_${name}`}
                error={error}
                tourStep={tourStep}
                label={label}
                required={required}
                icon={icon}
                isFocused={focused}
                name={name}
                value={value}
                onChange={(a) => this.handleChange(a)}
                onFocus={(a) => this.focusSelect(a)}
                onBlur={(a) => this.blurSelect(a)}
                options={options}
                placeholder={placeholder}
                isDisabled={isReadonly}
            />
        );
    }
}

FormType.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormType;