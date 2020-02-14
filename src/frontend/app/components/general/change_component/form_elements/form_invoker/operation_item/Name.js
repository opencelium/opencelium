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
 * Component for Name in Invoker.RequestItem
 */
class Name extends Component{

    constructor(props){
        super(props);

        this.state = {
            name: props.operation.name,
        };
    }

    componentDidMount(){
        let {name} = this.props.operation;
        if(name === ''){
            this.setState({
                name,
            });
        }
    }

    onChange(name){
        this.setState({name});
    }

    onBlur(){
        const {operation, updateEntity} = this.props;
        const {name} = this.state;
        operation.name = name;
        updateEntity();
    }

    render(){
        const {name} = this.state;
        const {ids, data, tourStep} = this.props;
        const {maxLength, readonly, required} = data;
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
                name={'Name'}
                id={ids && ids.hasOwnProperty('name') ? ids.name : ''}
                label={'Name'}
                type={'text'}
                icon={'perm_identity'}
                maxLength={255}
                value={name}
                readOnly={isReadonly}
                className={inputStyle}
                required={required}
                theme={{label: styles.form_input_label}}
            />
        );
    }
}

Name.propTypes = {
    operation: PropTypes.instanceOf(COperation).isRequired,
    data: PropTypes.object.isRequired,
};


export default Name;