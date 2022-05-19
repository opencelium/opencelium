/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React from 'react';
import styles from "@entity/connection/components/themes/default/general/form_methods";
import Select from "@entity/connection/components/components/general/basic_components/inputs/Select";
import {FUNCTIONAL_OPERATORS} from "@entity/connection/components/classes/components/content/connection/operator/CCondition";


class RelationalOperator extends React.Component{
    constructor(props) {
        super(props);
    }

    getStyles(){
        const {isOperatorHasThreeParams, isOperatorHasValue} = this.props;
        let {hasValue} = isOperatorHasValue();
        return {float: 'left', width: hasValue ? isOperatorHasThreeParams ? '14%' : '10%' : '25%', transition: 'width 0.3s ease 0s',};
    }

    getOptions(){
        return FUNCTIONAL_OPERATORS.map(operator => {return {value: operator.value, label: operator.hasOwnProperty('label') ? operator.label : operator.value};});
    }

    getLabel(){
        const {relationalOperator} = this.props;
        if(relationalOperator) {
            let functionalOperator = FUNCTIONAL_OPERATORS.find(o => o.value === relationalOperator.value);
            if (functionalOperator && functionalOperator.hasOwnProperty('placeholderValue')) {
                return functionalOperator.placeholderValue;
            }
            return relationalOperator.value;
        }
        return '';
    }

    render(){
        const {readOnly, relationalOperator, hasMethod, updateRelationalOperator} = this.props;
        let inputTheme = {inputElement: styles.input_element_pointer_compare_statement_visible};
        let options = this.getOptions();
        inputTheme.input = styles.input_pointer_compare_statement;
        return (
            <div style={this.getStyles()}>
                <span className={styles.if_relational_operator_separator}/>
                <Select
                    name={'relational_operators'}
                    value={relationalOperator ? {value: relationalOperator.value, label: this.getLabel()} : null}
                    onChange={updateRelationalOperator}
                    options={options}
                    closeOnSelect={false}
                    placeholder={`...`}
                    isDisabled={readOnly || !hasMethod}
                    isSearchable={false}
                    openMenuOnClick={true}
                    maxMenuHeight={200}
                    minMenuHeight={50}
                    selectMenuValueContainer={{
                        placeItems: 'center',
                        display: 'grid'
                    }}
                    styles={{
                        container: (provided, {isFocused, isDisabled}) => ({
                            fontSize: '12px',
                            borderBottom: isFocused && !isDisabled ? '2px solid #3f51b5 !important' : 'none',
                        }),
                        control: styles => ({
                            ...styles,
                            borderRadius: 0,
                            border: 'none',
                            boxShadow: 'none',
                            backgroundColor: 'initial',
                            borderBottom: '1px solid rgba(33, 33, 33, 0.12)'
                        }),
                        valueContainer: styles => ({
                            ...styles,
                            padding: '0',
                            textAlign: 'center',
                        }),
                        dropdownIndicator: () => ({display: 'none'}),
                        menu: (styles, {isDisabled}) => {
                            let s = {
                                ...styles,
                                top: 'auto',
                                marginTop: '-16px',
                                marginBottom: '8px',
                                width: '120px',
                                zIndex: '1',
                            };
                            if(isDisabled){
                                s = {
                                    ...styles,
                                    display: 'none'
                                };
                            }
                            return s;
                        },
                        singleValue: (styles, {data}) => {
                            return {
                                ...styles,
                                textAlign: 'center',
                                color: data.color,
                                background: data.color,
                                margin: '0 10%',
                                width: '80%',
                                maxWidth: 'none',
                            };
                        },
                        placeholder: (styles, {data}) => {
                            return {
                                ...styles,
                                width: '70%',
                                textAlign: 'center',
                            };
                        },
                        indicatorSeparator: (styles) => {
                            return {
                                ...styles,
                                backgroundColor: 'none',
                            };
                        }
                    }}
                />
                <span className={styles.if_relational_operator_separator}/>
            </div>
        );
    }
}

export default RelationalOperator;