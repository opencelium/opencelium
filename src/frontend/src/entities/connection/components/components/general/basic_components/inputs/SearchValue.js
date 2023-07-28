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

import UpdateParam from "@entity/connection/components/components/general/basic_components/inputs/UpdateParam";
import React from "react";

class SearchValue extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {id, name, value, type, labelText, selectedConnector, currentConnector, inputValue, updateConnection, paramCallback, onSelectItem, closeMenu, changeInputValue, connection, selectedMethod} = this.props;
        return(
            <div style={{position: 'relative'}}>
                <div style={{width: 'calc(100% - 40px)'}} onMouseDown={value.value !== "-1" ? (e) => onSelectItem(e, {value, type}) : null}>
                    {labelText}
                </div>
                <UpdateParam
                    ref={this.props.updateParamRef}
                    id={`${id}_param_button`}
                    name={name}
                    selectedMethod={selectedMethod}
                    selectedConnector={selectedConnector}
                    connection={connection}
                    type={type}
                    toggleCallback={(a) => paramCallback(a)}
                    changeInputValue={(a) => changeInputValue(a)}
                    updateConnection={updateConnection}
                    connector={currentConnector}
                    path={inputValue}
                    closeMenu={() => closeMenu()}
                />
            </div>
        );
    }
}

export default React.forwardRef((props, ref) => <SearchValue updateParamRef={ref} {...props}/>);