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
import {Row, Col} from "react-grid-system";

import {isNumber, consoleLog} from '@utils/app';

import styles from '@themes/default/general/enhancement.scss';


/**
 * Constants Component
 */
class Constants extends Component{

    constructor(props){
        super(props);

        this.state = {
            name: '',
            value: null,
            selected: {name: '', value: null},
        };
    }

    /**
     * to change constant name
     */
    onChangeConstantName(name){
        this.setState({
            name,
        });
    }

    /**
     * to change constant value
     */
    onChangeConstantValue(value){
        this.setState({
            value,
        });
    }

    /**
     * to add constant
     */
    addConstant(){
        const {constants, variables} = this.props;
        let {name, value} = this.state;
        if(constants.findIndex(constant => constant.name === name) === -1) {
            if(variables.findIndex(variable => variable.name === name) === -1) {
                if (isNumber(value)) {
                    value = parseInt(value);
                }
                this.props.addConstant({name, value});
            } else{
                consoleLog('A variable is already existed with such name');
            }
        } else{
            consoleLog('A constant is already existed with such name');
        }
    }

    /**
     * to remove constant
     */
    removeConstant(constant){
        this.props.removeConstant(constant);
    }

    /**
     * to add constant in code
     */
    addConstantInCode(constant){
        this.props.addConstantInCode(constant);
    }

    /**
     * to click on constant and add in code
     */
    onClickConstant(constant){
        const {selected} = this.state;
        const {readOnly} = this.props;
        if(!readOnly) {
            if (constant.name !== selected.name) {
                this.setState({selected: constant});
            } else {
                this.addConstantInCode(constant);
            }
        }
    }

    renderConstants(){
        const {constants, readOnly} = this.props;
        const {selected} = this.state;
        return constants.map((constant, key) => {
            let constantItemStyles = styles.constant_item;
            if(constant.name === selected.name){
                constantItemStyles += ' ' + styles.selected_constant_item;
            }
            return (
                <div key={key} className={constantItemStyles} onClick={() => this.onClickConstant(constant)}>
                    <div className={styles.content}>
                        <span className={styles.name}>{constant.name}</span>
                        {` = `}
                        <span className={isNumber(constant.value) ? styles.number_value : styles.string_value}>
                            {isNumber(constant.value) ? constant.value : `"${constant.value}"`}
                        </span>
                    </div>
                    {
                        readOnly
                        ?
                            null
                        :
                            <div className={styles.x} onClick={() => this.removeConstant(constant)}>x</div>
                    }
                </div>
            );
        });
    }
    
    render(){
        const {name, value} = this.state;
        const {readOnly} = this.props;
        return (
            <div>
                <div className={styles.constants_title}>Constants</div>
                <Row className={styles.constants}>
                    <Col md={readOnly ? 12 : 8 } className={styles.constants_list}>
                        {this.renderConstants()}
                    </Col>
                    {
                        readOnly
                        ?
                            null
                        :
                            <Col md={4} className={styles.constant_input_area}>
                                <Input
                                    type={'text'}
                                    label={'name'}
                                    value={name}
                                    onChange={(a) => this.onChangeConstantName(a)}
                                    theme={{
                                        input: styles.constant_input,
                                        inputElement: styles.constant_input_element,
                                        label: styles.constant_input_label
                                    }}
                                />
                                <Input
                                    type={'text'}
                                    label={'value'}
                                    value={value}
                                    onChange={(a) => this.onChangeConstantValue(a)}
                                    theme={{
                                        input: styles.constant_input,
                                        inputElement: styles.constant_input_element,
                                        label: styles.constant_input_label
                                    }}
                                />
                                <button onClick={(a) => this.addConstant(a)} className={styles.constant_add_button}>+</button>
                            </Col>
                    }
                </Row>
            </div>
        );
    }
}

Constants.propTypes = {
    constants: PropTypes.array.isRequired,
    addConstant: PropTypes.func.isRequired,
    removeConstant: PropTypes.func.isRequired,
    addConstantInCode: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
};

Constants.defaultProps = {
    readOnly: false,
};

export default Constants;