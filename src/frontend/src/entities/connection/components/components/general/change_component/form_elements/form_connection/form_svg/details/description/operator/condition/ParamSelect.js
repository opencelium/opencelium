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

import React from 'react';
import styles from "@entity/connection/components/themes/default/general/form_methods";
import Select from "@entity/connection/components/components/general/basic_components/inputs/Select";

class ParamSelect extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {readOnly, param, style, id, options, updateParam, styleParams} = this.props;
        let inputTheme = {};
        inputTheme.input = styles.input_pointer_param_if;
        return(
            <div style={style}>
                <span className={styles.if_relational_operator_separator}/>
                <Select
                    id={id}
                    name={'param_select'}
                    value={param}
                    onChange={updateParam}
                    options={options}
                    closeOnSelect={false}
                    placeholder={`...`}
                    isDisabled={readOnly}
                    isSearchable={false}
                    openMenuOnClick={true}
                    maxMenuHeight={200}
                    minMenuHeight={50}
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
                            let width = '70%';
                            if(styleParams && styleParams.hasOwnProperty('hasPlaceholderFullWidth')){
                                width = '100%';
                            }
                            return {
                                ...styles,
                                width,
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

export default ParamSelect;
