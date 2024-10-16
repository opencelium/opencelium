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
import {connect} from 'react-redux';
import {isString, setFocusById} from "@application/utils/utils";
import SelectableInput from "../SelectableInput";
import {setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {setModalCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ModalConnectionSlice";
import {CONNECTOR_FROM} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';

@GetModalProp()
@connect(null, {setCurrentTechnicalItem, setModalCurrentTechnicalItem}, null, {forwardRef: true})
class Name extends React.Component{
    constructor(props) {
        super(props);
        this.setCurrentTechnicalItem = props.isModal ? props.setModalCurrentTechnicalItem : props.setCurrentTechnicalItem;
        this.selectableInputRef = React.createRef();
    }

    changeName(optionValue){
        if(optionValue) {
            const {details, connection, updateConnection} = this.props;
            let connector = connection.getConnectorByType(details.connectorType);
            let method = {index: details.entity.index};
            let operation = connector.invoker.operations.find(o => o.name === optionValue.value);
            method.name = optionValue.value;
            method.request = operation.request.getObject({bodyOnlyConvert: true});
            method.response = operation.response.getObject({bodyOnlyConvert: true});
            let currentTechnicalItem;
            if (connector.getConnectorType() === CONNECTOR_FROM) {
                connection.removeFromConnectorMethod(details.entity, false);
                connection.addFromConnectorMethod(method);
                currentTechnicalItem = connection.fromConnector.getSvgElementByIndex(method.index);
            } else {
                connection.removeToConnectorMethod(details.entity, false);
                connection.addToConnectorMethod(method);
                currentTechnicalItem = connection.toConnector.getSvgElementByIndex(method.index);
            }
            updateConnection(connection);
            this.setCurrentTechnicalItem(currentTechnicalItem.getObject());
        }
    }

    getName(){
        const {details} = this.props;
        let name = details && isString(details.name) ? details.name : '';
        if(name === '') name = 'is empty';
        return name;
    }

    render(){
        const {readOnly, details} = this.props;
        const invoker = details.entity.invoker;
        const name = this.getName();
        return(
            <SelectableInput
                ref={this.selectableInputRef}
                id={`name_options`}
                readOnly={true}
                options={invoker.getAllOperationsForSelect()}
                changeValue={(a) => this.changeName(a)}
                label={'Name'}
                value={name}
            />
        );
    }
}

export default Name;
