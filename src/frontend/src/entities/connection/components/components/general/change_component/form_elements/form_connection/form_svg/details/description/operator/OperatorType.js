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
import SelectableInput
    from "@change_component/form_elements/form_connection/form_svg/details/description/SelectableInput";
import {CONNECTOR_FROM} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import {connect} from "react-redux";
import {setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { setModalCurrentTechnicalItem } from '@entity/connection/redux_toolkit/slices/ModalConnectionSlice';
import COperatorItem from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';


@GetModalProp()
@connect(null, {setCurrentTechnicalItem, setModalCurrentTechnicalItem})
class OperatorType extends React.Component{
    constructor(props) {
        super(props);
        this.setCurrentTechnicalItem = props.isModal ? props.setModalCurrentTechnicalItem : props.setCurrentTechnicalItem;
    }

    changeType(optionValue){
        if(optionValue) {
            const {details, connection, updateConnection} = this.props;
            const operatorItem = details.entity;
            let connector = connection.getConnectorByType(details.connectorType);
            if(connector) {
                let operator = {index: operatorItem.index, type: optionValue.value};
                let currentTechnicalItem;
                if (connector.getConnectorType() === CONNECTOR_FROM) {
                    connection.removeFromConnectorOperator(operatorItem);
                    connector.addOperator(operator);
                    currentTechnicalItem = connection.fromConnector.getSvgElementByIndex(operator.index);
                } else {
                    connection.removeToConnectorOperator(operatorItem);
                    connector.addOperator(operator);
                    currentTechnicalItem = connection.toConnector.getSvgElementByIndex(operator.index);
                }
                updateConnection(connection);
                this.setCurrentTechnicalItem(currentTechnicalItem.getObject());
            }
        }
    }

    render(){
        const {details, readOnly} = this.props;
        const operatorItem = details.entity;
        return(
            <SelectableInput
                id={`type_options`}
                readOnly={true}
                options={COperatorItem.getOperatorTypesForSelect()}
                changeValue={(a) => this.changeType(a)}
                label={'Type'}
                value={operatorItem.type}
            />
        );
    }
}

export default OperatorType;
