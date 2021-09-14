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

import {FormElement} from "@decorators/FormElement";
import Input from "@basic_components/inputs/Input";
import RadioButtons from "@basic_components/inputs/RadioButtons";

const types = [
    {value: 'apikey',                label: 'API Key'},
    {value: 'token',                 label: 'Token'},
    {value: 'basic',                 label: 'Basic Auth'},
    {value: 'endpointAuth',          label: 'Endpoint Auth'},
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

    handleChange(value){
        const {name, readonly} = this.props.data;
        if(!readonly) {
            const {entity, updateEntity} = this.props;
            entity[name] = value;
            updateEntity(entity, name);
        }
    }

    getAuthTypes(){
        const {name} = this.props.data;
        let authTypes = [];
        types.map((type, key) => {
            if(!type.hasOwnProperty('visible')){
                authTypes.push({
                    key: type.value,
                    label: type.label,
                    value: type.value,
                    id: key === 0 ? `input_${name}` : '',
                });
            } else{
                if(type.visible){
                    authTypes.push({
                        key: type.value,
                        label: type.label,
                        value: type.value,
                        id: key === 0 ? `input_${name}` : '',
                    });
                }
            }
        });
        return authTypes;
    }

    render(){
        const {name, icon, readOnly, label, required, error} = this.props.data;
        const {entity} = this.props;
        let {tourStep} = this.props.data;
        let value = entity[name];
        let typeValue = types.find(t => t.value === value);
        if(readOnly) {
            return (
                <Input className={`${tourStep ? tourStep : ''}`} readOnly={readOnly} value={typeValue ? typeValue.label : ''} label={label} icon={icon}/>
            );
        }
        return(
            <RadioButtons
                id={'form_auth'}
                error={error}
                inline={false}
                tourStep={tourStep}
                required={required}
                icon={icon}
                name={name}
                label={label}
                value={value}
                handleChange={::this.handleChange}
                radios={::this.getAuthTypes()}
            />
        );
    }
}

FormAuthentication.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormAuthentication;