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
import SelectableInput from "../SelectableInput";
import {setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";


@connect(null, {setCurrentTechnicalItem})
class DataAggregation extends React.Component{
    constructor(props) {
        super(props);
    }

    changeAggregator(optionValue){
        if(optionValue) {
            const {currentItem, connection, updateConnection, setCurrentTechnicalItem, details} = this.props;
            const connector = connection.getConnectorByType(details.connectorType);
            let dataAggregator = connection.dataAggregator.find(a => a.id === optionValue.value);
            connection.updateAssignItemsInDataAggregator(details.entity.name, optionValue.value);
            let method = connection.getMethodByColor(details.entity.color);
            method.dataAggregator = dataAggregator;
            const currentTechnicalItem = connector.getSvgElementByIndex(method.index);
            updateConnection(connection);
            setCurrentTechnicalItem(currentTechnicalItem.getObject());
        }
    }

    getAggregator(){
        const {connection, currentItem} = this.props;
        let aggregator = null;
        if(currentItem && currentItem.dataAggregator){
            if(!currentItem.dataAggregator.id){
                aggregator = connection.dataAggregator.find(a => a.id === currentItem.dataAggregator)
            } else{
                aggregator = currentItem.dataAggregator;
            }
        }
        if(aggregator) {
            aggregator = aggregator.name;
        } else{
            aggregator = 'is empty';
        }
        return aggregator;
    }

    render(){
        const {readOnly, connection} = this.props;
        const aggregator = this.getAggregator();
        return(
            <SelectableInput
                id={`data_aggregation_options`}
                readOnly={readOnly}
                options={connection.getAllAggregationsForSelect()}
                changeValue={(a) => this.changeAggregator(a)}
                label={'Aggregation'}
                value={aggregator}
            />
        );
    }
}

export default DataAggregation;
