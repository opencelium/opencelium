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

import styles from '@themes/default/general/change_component.scss';
import {FormElement} from "@decorators/FormElement";
import Input from "@basic_components/inputs/Input";

/**
 * Component for Email Editor
 */
@FormElement()
class FormBody extends Component{

    constructor(props){
        super(props);
    }

    handleInput(body){
        let {contentItem, updateEntity} = this.props;
        contentItem.body = body;
        updateEntity(contentItem);
    }

    render(){
        const {readOnly, required, error} = this.props.data;
        const {contentItem} = this.props;
        let {tourStep} = this.props.data;
        let isReadonly = false;
        let inputStyle = styles.form_input;
        if(tourStep){
            inputStyle += ' ' + tourStep.page_2[1].selector.substr(1);
        }
        inputStyle += ' ' + styles.form_input_textarea;
        if(readOnly){
            isReadonly = true;
        }
        return (
            <Input
                error={error ? error.body : ''}
                onChange={::this.handleInput}
                name={'input_body'}
                id={'input_body'}
                label={'Body'}
                type={'textarea'}
                icon={'drafts'}
                value={contentItem.body}
                multiline={true}
                rows={4}
                readOnly={isReadonly}
                className={inputStyle}
                required={required}
                theme={{label: styles.form_input_label}}
            />
        );
    }
}

FormBody.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormBody;