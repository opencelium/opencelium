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
import SelectSearch from "@entity/connection/components/components/general/basic_components/inputs/SelectSearch";

class ParamInput extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {readOnly, param, style, id, connector, items, updateParam, isMultiline, updateConnection, selectedMethod, selectedConnector, connection} = this.props;
        let inputTheme = {};
        inputTheme.input = styles.input_pointer_param_if;
        return (
            <div style={style}>
                <SelectSearch
                    id={id}
                    selectedConnector={selectedConnector}
                    connection={connection}
                    selectedMethod={selectedMethod}
                    updateConnection={updateConnection}
                    className={styles.operator_left_field}
                    placeholder={'param'}
                    items={items}
                    readOnly={readOnly}
                    doAction={updateParam}
                    onInputChange={updateParam}
                    inputValue={param}
                    currentConnector={connector}
                    isPopupMultiline={isMultiline}
                    popupRows={isMultiline ? 4 : 1}
                    dropdownClassName={styles.param_input_dropdown}
                />
            </div>
        );
    }
}

export default ParamInput;