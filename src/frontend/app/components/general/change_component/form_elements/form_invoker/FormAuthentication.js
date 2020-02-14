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
import { RadioGroup, RadioButton } from 'react-toolbox/lib/radio';


import theme from "react-toolbox/lib/input/theme.css";
import styles from '../../../../../themes/default/general/change_component.scss';
import {FormElement} from "../../../../../decorators/FormElement";
import FontIcon from "../../../basic_components/FontIcon";

const types = [
    {value: 'apikey',                label: 'API Key (i-doit)'},
    {value: 'token',                 label: 'Token (zabbix)'},
    {value: 'basic',                 label: 'Basic Auth (icinga2)'},
    {value: 'endpointAuth',          label: 'Endpoint Auth (otrs)'},
    {value: 'bearer_token',          label: 'Bearer Token', visible: false},
    {value: 'digest_auth',           label: 'Digest Auth', visible: false},
    {value: 'oauth_1_0',             label: 'OAuth 1.0', visible: false},
    {value: 'oauth_2_0',             label: 'OAuth 2.0', visible: false},
    {value: 'hawk_authentication',   label: 'Hawk Authentication', visible: false},
    {value: 'aws_signature',         label: 'AWS Signature', visible: false},
    {value: 'ntlm_authentication',   label: 'NTLM Authentication', visible: false},
];

/**
 * Component for Form Input
 */
@FormElement()
class FormAuthentication extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
        };
    }

    componentDidMount(){
        const {entity, data} = this.props;
        const {name} = data;
        let value = entity[name];
        if(value) {
            let icon = document.getElementById('firstRadio').parentElement.parentElement.parentElement.querySelector('[data-react-toolbox="font-icon"]');
            icon.style.color = '#3f51b5';
        }
    }


    handleChange(value){
        const {name, readonly} = this.props.data;
        if(!readonly) {
            const {entity, updateEntity} = this.props;
            entity[name] = value;
            updateEntity(entity);
        }
    }

    onFocusValue(e){
        let icon = e.currentTarget.parentElement.parentElement.parentElement.querySelector('[data-react-toolbox="font-icon"]');
        icon.style.color = '#3f51b5';
        this.setState({focused: true});
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

    renderAuthTypes(){
        return types.map((type, key) => {
            if(!type.hasOwnProperty('visible')){
                return (
                    <RadioButton
                        key={type.value}
                        label={type.label}
                        value={type.value}
                        onFocus={::this.onFocusValue}
                        id={key === 0 ? 'firstRadio' : ''}
                        theme={{field: styles.form_invoker_auth_radio_field, text: styles.form_invoker_auth_radio_text}}
                    />
                );
            } else{
                if(type.visible){
                    return (
                        <RadioButton
                            key={type.value}
                            label={type.label}
                            value={type.value}
                            onFocus={::this.onFocusValue}
                            id={key === 0 ? 'firstRadio' : ''}
                            theme={{field: styles.form_invoker_auth_radio_field, text: styles.form_invoker_auth_radio_text}}
                        />
                    );
                }
            }
        });
    }

    render(){
        const {name, icon} = this.props.data;
        const {entity} = this.props;
        let {tourStep} = this.props.data;
        let value = entity[name];
        return(
            <div className={`${theme.withIcon} ${theme.input} ${tourStep ? tourStep : ''}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.radiogroup_label}`}/>
                <RadioGroup name={name} value={value} onChange={::this.handleChange}>
                    {this.renderAuthTypes()}
                </RadioGroup>
                <FontIcon value={icon} className={theme.icon}/>
                <span className={theme.bar}/>
                {this.renderLabel()}
            </div>
        );
    }
}

FormAuthentication.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormAuthentication;