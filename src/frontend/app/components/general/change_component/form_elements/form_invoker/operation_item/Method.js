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
import styles from '../../../../../../themes/default/general/change_component.scss';
import theme from "react-toolbox/lib/input/theme.css";
import FontIcon from "../../../../basic_components/FontIcon";
import {onEnter} from "../../../../../../utils/app";
import {METHOD_TYPES} from "../../../../../../classes/components/content/invoker/request/CRequest";



/**
 * Component for Method in Invoker.RequestItem
 */
class Method extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
        };
    }

    chooseMethod(e, method){
        const {operation, updateEntity} = this.props;
        operation.request.method = method;
        updateEntity();
    }

    renderLabel(){
        let {required} = this.props.data;
        let labelStyle = theme.label;
        if(this.state.focused){
            labelStyle += ' ' + styles.multiselect_focused;
        }
        if(typeof required !== 'boolean'){
            required = false;
        }
        if(!required){
            return <label className={labelStyle}>Method</label>;
        }
        return <label className={labelStyle}>Method<span className={theme.required}> *</span></label>;
    }

    render(){
        const {operation, tourStep, data} = this.props;
        let {readOnly} = data;
        let value = operation.request.method;
        let inputStyle = '';
        if(tourStep){
            inputStyle = tourStep;
        }
        return (
            <div className={`${theme.withIcon} ${theme.input} ${inputStyle}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`} style={{padding: '8px 0 0 0'}}/>
                <div>
                    {
                        METHOD_TYPES.map((type, key) => {
                            return (
                                <span
                                    id={`method_${type.value}`}
                                    tabIndex={2 + key}
                                    key={key}
                                    className={`${value === type.value ? `${styles.invoker_selected_method} ${styles[`invoker_method_${type.value.toLowerCase()}`]}` : `${styles.invoker_request_item_method} ${readOnly ? '' : styles.invoker_request_item_method_not_readonly}`}`}
                                    onClick={readOnly ? null : (e) => ::this.chooseMethod(e, type.value)}
                                    onKeyDown={readOnly ? null : (e) => onEnter(e, (e) => ::this.chooseMethod(e, type.value))}
                                >
                                    {type.label}
                                </span>
                            );
                        })
                    }
                </div>
                <FontIcon value={'public'} className={theme.icon}/>
                <span className={theme.bar}/>
                {this.renderLabel()}
            </div>
        );
    }
}

export default Method;