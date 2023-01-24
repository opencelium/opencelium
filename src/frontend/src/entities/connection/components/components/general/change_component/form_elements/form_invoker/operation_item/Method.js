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

import React, {Component} from 'react';
import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import {onEnter} from "@application/utils/utils";
import {METHOD_TYPES} from "@entity/connection/components/classes/components/content/invoker/request/CRequest";
import ToolboxThemeInput from "../../../../../../hocs/ToolboxThemeInput";



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

    onFocus(){
        this.setState({
            focused: true,
        });
    }

    onBlur(){
        this.setState({
            focused: false,
        });
    }

    chooseMethod(e, method){
        const {operation, updateEntity} = this.props;
        operation.request.method = method;
        updateEntity('connectionMethod');
    }

    renderLabel(){
        let labelStyle = '';
        if(this.state.focused){
            labelStyle += ' ' + styles.multiselect_focused;
        }
        return(
            <span className={labelStyle}>Method</span>
        );
    }

    render(){
        const {focused} = this.state;
        const {operation, tourStep, data, error} = this.props;
        let {readOnly, required} = data;
        let value = operation.request.method;
        return (
            <ToolboxThemeInput error={error} icon={'public'} tourStep={tourStep} required={required} label={this.renderLabel()} iconClassName={focused ? styles.icon_focused : ''}>
                {
                    METHOD_TYPES.map((type, key) => {
                        return (
                            <button
                                id={'input_connectionMethod'}
                                key={key}
                                className={styles.invoker_request_item_method_button}
                                onClick={readOnly ? null : (e) => this.chooseMethod(e, type.value)}
                                onKeyDown={readOnly ? null : (e) => onEnter(e, (e) => this.chooseMethod(e, type.value))}
                                onFocus={(a) => this.onFocus(a)}
                                onBlur={(a) => this.onBlur(a)}
                            >
                                <span
                                    id={`method_${type.value}`}
                                    tabIndex={2 + key}
                                    key={key}
                                    className={`${value === type.value ? `${styles.invoker_selected_method} ${styles[`invoker_method_${type.value.toLowerCase()}`]}` : `${styles.invoker_request_item_method} ${readOnly ? '' : styles.invoker_request_item_method_not_readonly}`}`}
                                >
                                    {type.label}
                                </span>
                            </button>
                        );
                    })
                }
            </ToolboxThemeInput>
        );
    }
}

export default Method;