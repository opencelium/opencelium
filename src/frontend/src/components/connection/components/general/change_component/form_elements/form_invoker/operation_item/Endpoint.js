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
import Input from '@basic_components/inputs/Input';

import styles from '@themes/default/general/change_component.scss';
import COperation from "@classes/components/content/invoker/COperation";


/**
 * Component for Path in Invoker.RequestItem
 */
class Endpoint extends Component{

    constructor(props){
        super(props);

        this.state = {
            endpoint: props.operation.request.endpoint,
        };
    }

    componentDidMount(){
        let endpoint = this.props.operation.request.endpoint;
        if(endpoint === ''){
            this.setState({
                endpoint,
            });
        }
    }

    onChange(endpoint){
        this.setState({endpoint});
    }

    onBlur(){
        const {operation, updateEntity} = this.props;
        const {endpoint} = this.state;
        if(operation.request.endpoint !== endpoint) {
            operation.request.endpoint = endpoint;
            updateEntity();
        }
    }

    render(){
        const {readOnly} = this.props.data;
        const {endpoint} = this.state;
        let {tourStep, index, forConnection} = this.props;
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
                onChange={(a) => this.onChange(a)}
                onBlur={(a) => this.onBlur(a)}
                name={'Path'}
                id={`input_invoker_connection_path_${index ? index : ''}`}
                label={'Path'}
                type={'text'}
                icon={forConnection ? '' : 'perm_identity'}
                maxLength={forConnection ? 0 : 2048}
                value={endpoint}
                readOnly={isReadonly}
                className={inputStyle}
                required={false}
                theme={{
                    label: forConnection ? styles.form_input_label_for_connection : styles.form_input_label,
                    input: forConnection ? styles.form_input_input_for_connection : '',
                    inputElement: forConnection ? styles.form_input_element_for_connection : '',
                }}
            />
        );
    }
}

Endpoint.propTypes = {
    operation: PropTypes.instanceOf(COperation).isRequired,
    data: PropTypes.object.isRequired,
};

Endpoint.defaultProps = {
    forConnection : false,
};


export default Endpoint;