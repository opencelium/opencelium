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
import Input from '@entity/connection/components/components/general/basic_components/inputs/Input';

import styles from '@entity/connection/components/themes/default/general/change_component.scss';


class HeaderValue extends Component{
    constructor(props){
        super(props);

        this.state = {
            headerKey: props.item.value
        };
    }

    onChange(value){
        this.setState({headerKey: value});
    }

    onBlur(e, key, type){
        const {headerKey} = this.state;
        const {onBlur, onChange} = this.props;
        onBlur();
        onChange(headerKey, key, type);
    }

    render(){
        const {headerKey} = this.state;
        const {item, readOnly, onFocus, forConnection} = this.props;
        return(
            <Input
                name={`input_header_${item.name}`}
                value={headerKey}
                onChange={(a) => this.onChange(a)}
                onFocus={onFocus}
                onBlur={(e) => this.onBlur(e, item.name, 'value')}
                label={forConnection ? '' : 'Value'}
                type={'text'}
                maxLength={forConnection ? 0 : 255}
                readOnly={readOnly}
                className={styles.invoker_item_val}
                theme={{
                    label: forConnection ? styles.form_input_label_for_connection : styles.form_input_label,
                    input: forConnection ? styles.form_input_input_header_for_connection : '',
                    inputElement: forConnection ? styles.form_input_header_element_for_connection : '',
                }}
            />
        );
    }
}

export default HeaderValue;