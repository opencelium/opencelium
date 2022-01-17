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
import {connect} from 'react-redux';

import {toggleAppTour} from '@actions/auth';
import {withTranslation} from "react-i18next";
import TooltipSwitch from "@basic_components/tooltips/TooltipSwitch";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CMyProfileControl from "@classes/voice_control/CMyProfileControl";
import ToolboxThemeInput from "@root/app/hocs/ToolboxThemeInput";
import {API_REQUEST_STATE} from "@utils/constants/app";
import styles from "@themes/default/general/basic_components";
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
                    onChange={::this.onChange}
                />
            </ToolboxThemeInput>
        );
    }
}


export default FormSwitch;