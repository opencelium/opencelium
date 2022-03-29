import React from 'react';
import {connect} from 'react-redux';
import {isString, setFocusById} from "@utils/app";
import SelectableInput from "../SelectableInput";
import {setCurrentTechnicalItem} from "@slice/connection/ConnectionSlice";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";


@connect(null, {setCurrentTechnicalItem})
class Name extends React.Component{
    constructor(props) {
        super(props);
    }

    changeName(optionValue){
        if(optionValue) {
            const {details, connection, updateConnection, setCurrentTechnicalItem} = this.props;
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
            setCurrentTechnicalItem(currentTechnicalItem.getObject());
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
                id={`name_options`}
                readOnly={readOnly}
                options={invoker.getAllOperationsForSelect()}
                changeValue={(a) => this.changeName(a)}
                label={'Name'}
                value={name}
            />
        );
    }
}

export default Name;