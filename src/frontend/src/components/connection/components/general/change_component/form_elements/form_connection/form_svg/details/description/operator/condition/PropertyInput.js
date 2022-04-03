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

import React from 'react';
import styles from "@themes/default/general/form_methods";
import SelectSearch from "@basic_components/inputs/SelectSearch";

class PropertyInput extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {readOnly, style, equalStyle, predicator, id, updateProperty, items, connector, property, updateConnection, selectedMethod, connection, selectedConnector} = this.props;
        return (
            <React.Fragment>
                <div style={style}>
                    <SelectSearch
                        id={id}
                        selectedMethod={selectedMethod}
                        selectedConnector={selectedConnector}
                        connection={connection}
                        updateConnection={updateConnection}
                        className={styles.operator_right_field}
                        placeholder={'param'}
                        items={items}
                        readOnly={readOnly}
                        doAction={updateProperty}
                        onInputChange={updateProperty}
                        inputValue={property}
                        predicator={predicator}
                        currentConnector={connector}
                        dropdownClassName={styles.param_input_dropdown}
                    />
                </div>
                <div className={styles.property_input_right_equal} style={equalStyle}>
                    =
                </div>
            </React.Fragment>
        );
    }
}

export default PropertyInput;