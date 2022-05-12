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
import Input from '@entity/connection/components/components/general/basic_components/inputs/Input';

import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import {FormElement} from "@entity/connection/components/decorators/FormElement";
import FormSelect from "./FormSelect";
import FormInput from "@change_component/form_elements/FormInput";


/**
 * Component for Select with Description
 */
@FormElement()
class FormSelectDescription extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {name, error, readonly} = this.props.data;
        const {entity} = this.props;
        const description = this.props.data.description;
        let value = entity[name];
        if(value && value.hasOwnProperty('value')){
            value = value.value;
        }
        let descriptionValue = readonly ? entity.description : description.values[value];
        return (
            <div>
                {readonly ? <FormInput {...this.props} id={`input_${name}`}/> : <FormSelect {...this.props} id={`input_${name}`}/>}
                <Input
                    tabIndex={'-1'}
                    name={description.name}
                    type={'text'}
                    icon={'notes'}
                    value={descriptionValue}
                    multiline={true}
                    rows={4}
                    readOnly={true}
                    className={styles.form_select_description_textarea}
                />
            </div>
        );
    }
}

FormSelectDescription.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormSelectDescription;