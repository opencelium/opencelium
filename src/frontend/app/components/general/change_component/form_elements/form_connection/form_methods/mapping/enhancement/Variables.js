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
 * Variables Component
 */
class Variables extends Component{

    constructor(props){
        super(props);

        this.state = {
            selected: {name: '', value: null}
        };
    }

    /**
     * to add variable in code
     */
    addVariableInCode(variable){
        this.props.addVariableInCode(variable);
    }

    /**
     * to click on variable
     */
    onClickVariable(variable){
        const {selected} = this.state;
        const {readOnly} = this.props;
        if(!readOnly) {
            if (variable.name !== selected.name) {
                this.setState({selected: variable});
            } else {
                this.addVariableInCode(variable);
            }
        }
    }

    renderVariables(){
        const {variables} = this.props;
        const {selected} = this.state;
        return variables.map((variable, key) => {
            let variableItemStyles = styles.variable_item;
            if(variable.name === selected.name){
                variableItemStyles += ' ' + styles.selected_variable_item;
            }
            return (
                <div key={key} className={variableItemStyles} onClick={() => ::this.onClickVariable(variable)}>
                    {variable.name}
                </div>
            );
        });
    }
    
    render(){
        return (
            <div>
                <div className={styles.variables_title}>Variables</div>
                <div className={styles.variables_list}>
                    {this.renderVariables()}
                </div>
            </div>
        );
    }
}

Variables.propTypes = {
    variables: PropTypes.array.isRequired,
    addVariableInCode: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
};

Variables.defaultProps = {
    readOnly: false,
};

export default Variables;