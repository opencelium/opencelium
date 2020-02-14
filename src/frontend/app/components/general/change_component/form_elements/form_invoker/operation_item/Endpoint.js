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
import Input from '../../../../basic_components/inputs/Input';

import styles from '../../../../../../themes/default/general/change_component.scss';
import COperation from "../../../../../../classes/components/content/invoker/COperation";


/**
 * Component for Path in Invoker.RequestItem
 */
class Endpoint extends Component{

    constructor(props){
        super(props);

        this.state = {
            endpoint: props.operation.request.query,
        };
    }

    componentDidMount(){
        let endpoint = this.props.operation.request.query;
        if(endpoint === ''){
            this.setState({
                endpoint,
            });
        }
    }

    componentDidUpdate(prevProps){
        const {focused} = prevProps.data;
        if(focused || this.props.data.focused){
            let elem = document.getElementById('input_invoker_connection_path');
            if(elem) {
                elem.focus();
            }
        }
    }

    onChange(endpoint){
        this.setState({endpoint});
    }

    onBlur(){
        const {operation, updateEntity} = this.props;
        const {endpoint} = this.state;
        operation.request.query = endpoint;
        updateEntity();
    }

    render(){
        const {readonly} = this.props.data;
        const {endpoint} = this.state;
        let {tourStep} = this.props;
        let isReadonly = false;
        let inputStyle = '';
        if(tourStep){
            inputStyle = tourStep;
        }
        if(readonly){
            isReadonly = true;
        }
        return (
            <Input
                onChange={::this.onChange}
                onBlur={::this.onBlur}
                name={'Path'}
                id={'input_invoker_connection_path'}
                label={'Path'}
                type={'text'}
                icon={'perm_identity'}
                maxLength={2048}
                value={endpoint}
                readOnly={isReadonly}
                className={inputStyle}
                required={false}
                theme={{label: styles.form_input_label}}
            />
        );
    }
}

Endpoint.propTypes = {
    operation: PropTypes.instanceOf(COperation).isRequired,
    data: PropTypes.object.isRequired,
};


export default Endpoint;