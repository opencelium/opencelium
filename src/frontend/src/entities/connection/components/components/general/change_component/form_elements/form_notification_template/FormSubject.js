/*
 *  Copyright (C) <2023>  <becon GmbH>
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
import Input from '@entity/connection/components/components/general/basic_components/inputs/Input';

import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import {FormElement} from "@entity/connection/components/decorators/FormElement";
import {setFocusById} from "@application/utils/utils";

/**
 * Component for Subject
 */
@FormElement()
class FormSubject extends Component{

    constructor(props){
        super(props);
        this.state = {
            subject: props.contentItem.subject,
        };
    }

    componentDidMount(){
        setFocusById('input_subject');
    }

    onBlurSubject(){
        const {subject} = this.state;
        let {contentItem, updateEntity} = this.props;
        contentItem.subject = subject;
        updateEntity(contentItem, 'subject');
    }

    changeSubject(subject){
        this.setState({subject});
    }

    render(){
        const {subject} = this.state;
        const {data} = this.props;
        const {readOnly, required, tourStep, error} = data;
        let isReadonly = false;
        let inputStyle = styles.form_input;
        if(tourStep){
            inputStyle += ' ' + tourStep.page_2[0].selector.substr(1);
        }
        if(readOnly){
            isReadonly = true;
        }
        return(
            <Input
                id={`input_subject`}
                error={error ? error.subject : ''}
                onChange={(a) => this.changeSubject(a)}
                onBlur={(a) => this.onBlurSubject(a)}
                name={'input_subject'}
                label={'Subject'}
                type={'text'}
                icon={'subject'}
                maxLength={255}
                value={subject}
                readOnly={isReadonly}
                className={inputStyle}
                required={required}
                theme={{label: styles.form_input_label}}
            />
        );
    }
}

FormSubject.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormSubject;