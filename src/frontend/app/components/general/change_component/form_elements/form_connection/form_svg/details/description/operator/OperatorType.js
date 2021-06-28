import React from 'react';
import SelectableInput
    from "@change_component/form_elements/form_connection/form_svg/details/description/SelectableInput";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import {connect} from "react-redux";
import {setCurrentTechnicalItem} from "@actions/connection_overview_2/set";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";


@connect(null, {setCurrentTechnicalItem})
class OperatorType extends React.Component{
    constructor(props) {
        super(props);
    }

    changeType(optionValue){
        if(optionValue) {
            const {details, connection, updateConnection, setCurrentTechnicalItem} = this.props;
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
                setCurrentTechnicalItem(currentTechnicalItem);
            }
        }
    }

    render(){
        const {details, readOnly} = this.props;
        const operatorItem = details.entity;
        return(
            <SelectableInput
                id={`type_options`}
                readOnly={readOnly}
                options={COperatorItem.getOperatorTypesForSelect()}
                changeValue={::this.changeType}
                label={'Type'}
                value={operatorItem.type}
            />
        );
    }
}

export default OperatorType;