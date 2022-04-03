

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
import ToolboxThemeInput from "@root/hocs/ToolboxThemeInput";
import {CustomInput} from "reactstrap";


/**
 * Switch Component
 */
class FormSwitch extends Component{

    constructor(props){
        super(props);
    }

    onChange(){
        const {name} = this.props.data;
        const {entity, updateEntity} = this.props;
        entity[name] = !entity[name];
        updateEntity(entity, name);
    }

    render(){
        const {entity, data} = this.props;
        const {enabledTitle, disabledTitle, label, icon, name} = data;
        const checked = entity[name];
        return (
            <ToolboxThemeInput label={label} icon={icon}>
                <CustomInput
                    id={'app_tour'}
                    type="switch"
                    label={checked ? enabledTitle : disabledTitle}
                    checked={checked}
                    onChange={(a) => this.onChange(a)}
                />
            </ToolboxThemeInput>
        );
    }
}


export default FormSwitch;