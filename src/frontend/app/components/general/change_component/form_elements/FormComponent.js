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
import {FormElement} from "@decorators/FormElement";
import ToolboxThemeInput from "../../../../hocs/ToolboxThemeInput";

/**
 * Form Component
 */
@FormElement()
class FormComponent extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {name, label, icon} = this.props.data;
        const {entity, updateEntity} = this.props;
        let {tourStep, Component} = this.props.data;
        let value = entity[name];
        if(!icon){
            return <Component entity={entity} updateEntity={updateEntity}/>;
        }
        return (
            <ToolboxThemeInput
                icon={icon}
                tourStep={tourStep}
                label={label}
            >
                <Component entity={entity} updateEntity={updateEntity}/>
            </ToolboxThemeInput>
        );
    }
}

FormComponent.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormComponent;