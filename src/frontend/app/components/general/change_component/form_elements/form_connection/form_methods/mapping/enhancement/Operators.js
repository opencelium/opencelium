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

import styles from '@themes/default/general/enhancement.scss';


/**
 * Operators Component
 */
class Operators extends Component{

    constructor(props){
        super(props);

        this.state = {
            selected: {name: '', value: null},
        };
    }

    /**
     * to add operator in code
     */
    addOperatorInCode(operator){
        this.props.addOperatorInCode(operator);
    }

    /**
     * to click on operator
     */
    onClickOperator(operator){
        const {selected} = this.state;
        const {readOnly} = this.props;
        if(!readOnly) {
            if (operator.name !== selected.name) {
                this.setState({selected: operator});
            } else {
                this.addOperatorInCode(operator);
            }
        }
    }

    renderOperators(){
        const {operators} = this.props;
        const {selected} = this.state;
        return operators.map((operator, key) => {
            let operatorItemStyles = styles.operator_item;
            if(operator.name === selected.name){
                operatorItemStyles += ' ' + styles.operator_item_selected;
            }
            return (
                <div key={key} className={operatorItemStyles} onClick={() => ::this.onClickOperator(operator)}>
                    {operator.name}
                </div>
            );
        });
    }

    render(){
        return (
            <div>
                <div className={styles.operators_title}>Operators</div>
                <div className={styles.operators_list}>
                    {this.renderOperators()}
                </div>
            </div>
        );
    }
}

Operators.propTypes = {
    operators: PropTypes.array.isRequired,
    addOperatorInCode: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
};

Operators.defaultProps = {
    readOnly: false,
};

export default Operators;