/*
 * Copyright (C) <2020>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import MethodItem from "./method/MethodItem";
import OperatorItem from "./operator/OperatorItem";
import CConnectorItem, {
    CONNECTOR_FROM,
    OPERATOR_ITEM
} from "../../../../../../classes/components/content/connection/CConnectorItem";
import CConnection from "../../../../../../classes/components/content/connection/CConnection";
import FontIcon from "../../../../basic_components/FontIcon";
import TooltipFontIcon from "../../../../basic_components/tooltips/TooltipFontIcon";
import CMethodItem from "../../../../../../classes/components/content/connection/method/CMethodItem";
import COperatorItem from "../../../../../../classes/components/content/connection/operator/COperatorItem";
import {sortByIndex, sortByIndexFunction} from "../../../../../../utils/app";


/**
 * Items component
 */
class Items extends Component{

    constructor(props){
        super(props);

        this.state = {
            pointerTop: 30
        };
    }

    componentDidUpdate(){
        const {pointerTop} = this.state;
        let {connector} = this.props;
        let connectorType = connector.getConnectorType();
        let currentItem = connector.getCurrentItem();
        if(currentItem) {
            let child = document.getElementById(`${currentItem.index}__${connectorType}`);
            if (child) {
                if(pointerTop !== child.offsetTop + 18) {
                    this.setState({pointerTop: child.offsetTop + 18});
                }
            }
        }
    }

    renderItems() {
        const {connection, connector, updateEntity, readOnly} = this.props;
        let allItems = [];
        let allComponents = [];
        for(let i = 0; i < connector.methods.length; i++){
            allItems.push(connector.methods[i]);
        }
        for(let i = 0; i < connector.operators.length; i++){
            allItems.push(connector.operators[i]);
        }
        if(allItems.length > 1){
            allItems = sortByIndex(allItems);
        }
        for(let i = 0; i < allItems.length; i++){
            if(allItems[i] instanceof CMethodItem){
                allComponents.push(<MethodItem key={allItems[i].uniqueIndex} index={i} readOnly={readOnly} connection={connection} connector={connector} method={allItems[i]} updateEntity={updateEntity}/>);
            }
            if(allItems[i] instanceof  COperatorItem){
                allComponents.push(<OperatorItem key={allItems[i].uniqueIndex} index={i} readOnly={readOnly} connection={connection} connector={connector} operator={allItems[i]} updateEntity={updateEntity}/>);
            }
        }
        return allComponents;
    }

    renderPointer() {
        const {pointerTop} = this.state;
        let {connector} = this.props;
        let connectorType = connector.getConnectorType();
        let currentItem = connector.getCurrentItem();
        let styles = {position: 'absolute', right: '-25px', top: `${pointerTop}px`, transition: '0.2s all'};
        if(currentItem) {
            return (
                <TooltipFontIcon value={'arrow_back'} tooltip={connectorType === CONNECTOR_FROM ? 'Left Pointer' : 'Right Pointer'} style={styles}/>
            );
        }
        return null;
    }

    render(){
        return (
            <div>
                {this.renderItems()}
                {::this.renderPointer()}
            </div>
        );
    }
}

Items.propTypes = {
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem).isRequired,
    updateEntity: PropTypes.func.isRequired,
};

export default Items;