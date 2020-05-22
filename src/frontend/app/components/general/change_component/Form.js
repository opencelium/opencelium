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
import FormInput from "./form_elements/FormInput";
import ChipList from "../basic_components/ChipList";
import FormSelect from "./form_elements/FormSelect";
import FormInputFile from "./form_elements/FormInputFile";
import FormSelectDescription from "./form_elements/FormSelectDescription";
import FormMultiSelect from "./form_elements/FormMultiSelect";
import FormPermissionTable from "./form_elements/FormPermissionTable";

import styles from '../../../themes/default/general/change_component.scss';
import FormSecretInput from "./form_elements/FormSecretInput";
import FormConnectors from "./form_elements/form_connection/form_connectors/FormConnectors";
import FormMethods from "./form_elements/form_connection/form_methods/FormMethods";
import {getThemeClass, isString} from "../../../utils/app";
import FormMode from "./form_elements/form_connection/FormMode";
import FormConnectionTitle from "./form_elements/form_connection/FormTitle";
import FormUserTitle from "./form_elements/FormUserTitle";
import FormInvokerName from './form_elements/form_invoker/FormName';
import FormInvokerDescription from './form_elements/form_invoker/FormDescription';
import FormInvokerHint from './form_elements/form_invoker/FormHint';
import FormInvokerIcon from './form_elements/form_invoker/FormIcon';
import FormAuthentication from "./form_elements/form_invoker/FormAuthentication";
import FormConnection from "./form_elements/form_invoker/FormConnection";
import FormOperations from "./form_elements/form_invoker/FormOperations";
import FormNotificationTemplateName from './form_elements/form_notification_template/FormName';
import FormNotificationTemplateType from './form_elements/form_notification_template/FormType';
import FormContent from "./form_elements/form_notification_template/FormContent";


/**
 * Form Component
 */
class Form extends Component{

    constructor(props){
        super(props);
    }

    /**
     * to map Field Inputs correspondingly
     */
    mapInputs(data, key){
        const {entity, updateEntity, clearValidationMessage} = this.props;
        switch(data.type){
            case 'select+description':
                return <FormSelectDescription
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'select':
                return <FormSelect
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'multiselect':
                return <FormMultiSelect
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                    />;
            case 'permission_table':
                return <FormPermissionTable
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'chiplist':
                return <ChipList key={key} data={data} entity={entity} updateEntity={updateEntity} deletable/>;
            case 'file':
                return <FormInputFile
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'secret':
                return <FormSecretInput
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'password':
            case 'text':
            case 'email':
            case 'textarea':
                return <FormInput
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'connection_title':
                return <FormConnectionTitle
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                    clearValidationMessage={clearValidationMessage}
                />;
            case 'connectors':
                return <FormConnectors
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'connection_mode':
                return <FormMode
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                    clearValidationMessage={clearValidationMessage}
                />;
            case 'methods':
                return <FormMethods
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'invoker_name':
                return <FormInvokerName
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                    clearValidationMessage={clearValidationMessage}
                />;
            case 'invoker_description':
                return <FormInvokerDescription
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'invoker_hint':
                return <FormInvokerHint
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'invoker_icon':
                return <FormInvokerIcon
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'invoker_connection':
                return <FormConnection
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'invoker_authentication':
                return <FormAuthentication
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'invoker_operations':
                return <FormOperations
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'user_title':
                return <FormUserTitle
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                />;
            case 'notification_template_name':
                return <FormNotificationTemplateName
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                    clearValidationMessage={clearValidationMessage}
                />;
            case 'notification_template_type':
                return <FormNotificationTemplateType
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                    clearValidationMessage={clearValidationMessage}
                />;
            case 'notification_template_content':
                return <FormContent
                    key={key}
                    entity={entity}
                    updateEntity={updateEntity}
                    data={data}
                    clearValidationMessage={clearValidationMessage}
                />;

        }
        return null;
    }

    /**
     * to generate Input Fields
     */
    generateInputs(){
        let result;
        const {inputs, focusedInput, setFocusInput} = this.props;
        if(Array.isArray(inputs)) {
            result = inputs.map((data, key) => {
                data['tourStep'] = data['tourStep'] && isString(data['tourStep']) ? data['tourStep'].substr(1) : data['tourStep'];
                data['setFocusInput'] = setFocusInput;
                data['focused'] = focusedInput !== '' && focusedInput === data.name;
                data['visible'] = data.hasOwnProperty('visible') ? data.visible : true;
                return this.mapInputs(data, key);
            });
        }
        return result.map(Element => {return Element;});
    }

    render(){
        const {authUser} = this.props;
        let classNames = ['form'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div className={styles[classNames.form]}>
                {this.generateInputs()}
            </div>
        );
    }
}

Form.propTypes = {
    inputs: PropTypes.array.isRequired,
    entity: PropTypes.object.isRequired,
    updateEntity: PropTypes.func.isRequired,
    focusedInput: PropTypes.string,
    authUser: PropTypes.object.isRequired,
    clearValidationMessage: PropTypes.func.isRequired,
};

Form.defaultProps = {
    focusedInput: '',
};

export default Form;