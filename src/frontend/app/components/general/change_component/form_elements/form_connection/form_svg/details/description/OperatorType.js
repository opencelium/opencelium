import React from 'react';
import SelectableInput
    from "@change_component/form_elements/form_connection/form_svg/details/description/SelectableInput";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import {connect} from "react-redux";
import {setCurrentTechnicalItem} from "@actions/connection_overview_2/set";


@connect(null, {setCurrentTechnicalItem})
class OperatorType extends React.Component{
    constructor(props) {
        super(props);
    }

    changeType(optionValue){
        if(optionValue) {
            const {operatorItem, connection, updateConnection, setCurrentTechnicalItem} = this.props;
            let connector = connection.getConnectorByOperatorIndex(operatorItem);
            let operator = {index: operatorItem.index, type: optionValue.value};
            let currentItem;
            if (connector.getConnectorType() === CONNECTOR_FROM) {
                connection.removeFromConnectorOperator(operatorItem);
                connector.addOperator(operator);
                currentItem = connection.fromConnector.getSvgElementByIndex(operator.index);
            } else {
                connection.removeToConnectorOperator(operatorItem);
                connector.addOperator(operator);
                currentItem = connection.toConnector.getSvgElementByIndex(operator.index);
            }
            updateConnection(connection);
            setCurrentTechnicalItem(currentItem);
        }
    }

    render(){
        const {operatorItem} = this.props;
        return(
            <SelectableInput
                id={`type_options`}
                options={[{label: 'if', value: 'if'},{label: 'loop', value: 'loop'}]}
                changeValue={::this.changeType}
                label={'Type'}
                value={operatorItem.type}
            />
        );
    }
}

export default OperatorType;