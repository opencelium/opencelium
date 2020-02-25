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
import Input from '../../../../basic_components/inputs/Input';

import styles from '../../../../../../themes/default/general/change_component.scss';
import COperation from "../../../../../../classes/components/content/invoker/COperation";


/**
 * Component for Status in Invoker.ResponseItem
 */
class Status extends Component{

    constructor(props){
        super(props);

        this.state = {
            status: props.entity.status,
        };
    }

    onChange(status){
        this.setState({status});
    }

    onBlur(){
        const {entity, updateEntity} = this.props;
        const {status} = this.state;
        entity.status = status;
        updateEntity();
    }

    render(){
        const {readOnly} = this.props.data;
        const {status} = this.state;
        let {tourStep} = this.props;
        let isReadonly = false;
        let inputStyle = '';
        if(tourStep){
            inputStyle = tourStep;
        }
        if(readOnly){
            isReadonly = true;
        }
        return (
            <Input
                onChange={::this.onChange}
                onBlur={::this.onBlur}
                name={'Status'}
                id={'input_invoker_connection_status'}
                label={'Status'}
                type={'number'}
                icon={'all_inclusive'}
                maxLength={255}
                value={status}
                readOnly={isReadonly}
                className={inputStyle}
                required={false}
                theme={{label: styles.form_input_label}}
            />
        );
    }
}

Status.propTypes = {
    operation: PropTypes.instanceOf(COperation).isRequired,
    data: PropTypes.object.isRequired,
};


export default Status;