/*
 * Copyright (C) <2021>  <becon GmbH>
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
import {connect} from "react-redux";
import {setCurrentBusinessItem, setCurrentTechnicalItem} from "@actions/connection_overview_2/set";
import {mapItemsToClasses} from "../utils";
import Svg from "../layouts/Svg";
import styles from "@themes/default/content/connections/connection_overview_2";
import {setTechnicalLayoutLocation} from "@actions/connection_overview_2/set";
import CConnectorItem, {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import CConnection from "@classes/components/content/connection/CConnection";
import {HAS_LAYOUTS_SCALING} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";

function mapStateToProps(state){
    const {currentBusinessItem, currentTechnicalItem, connection, updateConnection} = mapItemsToClasses(state);
    let arrows = connection ? [...connection.fromConnector.arrows, ...connection.toConnector.arrows] : [];
    const items = connection ? [...connection.fromConnector.svgItems, ...connection.toConnector.svgItems] : [];
    return{
        currentBusinessItem,
        currentTechnicalItem,
        items,
        arrows,
        connection,
        updateConnection,
    };
}

@connect(mapStateToProps, {setCurrentBusinessItem, setCurrentTechnicalItem, setTechnicalLayoutLocation})
class ExtendedTechnicalLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'technical_layout';
    }

    setCurrentItem(currentItem){
        const {setCurrentTechnicalItem, connection, updateConnection} = this.props;
        setCurrentTechnicalItem(currentItem);
        if(connection) {
            const connector = connection.getConnectorByType(currentItem.connectorType);
            connector.setCurrentItem(currentItem.entity);
            updateConnection(connection);
        }
    }

    deleteProcess(process){
        const {connection, updateConnection, setCurrentTechnicalItem} = this.props;
        const method = process.entity;
        const connector = connection.getConnectorByType(process.connectorType);
        if(connector){
            if(connector.getConnectorType() === CONNECTOR_FROM){
                connection.removeFromConnectorMethod(method);
            } else{
                connection.removeToConnectorMethod(method);
            }
            updateConnection(connection);
            const currentItem = connector.getCurrentItem();
            if(currentItem){
                const currentSvgElement = connector.getSvgElementByIndex(currentItem.index);
                setCurrentTechnicalItem(currentSvgElement);
            }
        }
    }

    getPanelParams(){
        const {items, connection, currentBusinessItem} = this.props;
        let isAssignMode = false;
        let fromConnectorItems = [];
        let toConnectorItems = [];
        for(let i = 0; i < items.length; i++){
            if(items[i].connectorType === CONNECTOR_FROM){
                fromConnectorItems.push(items[i]);
            }
            if(items[i].connectorType === CONNECTOR_TO){
                toConnectorItems.push(items[i]);
            }
        }
        let fromConnectorPanelParams = {panelPosition: CConnectorItem.getPanelPosition(fromConnectorItems, connection.fromConnector.shiftXForSvgItems), rectPosition: CConnectorItem.getPanelRectPosition(fromConnectorItems, connection.fromConnector.shiftXForSvgItems), invokerName: connection.fromConnector.invoker.name};
        let toConnectorPanelParams = {panelPosition: CConnectorItem.getPanelPosition(toConnectorItems, connection.toConnector.shiftXForSvgItems), rectPosition: CConnectorItem.getPanelRectPosition(toConnectorItems, connection.toConnector.shiftXForSvgItems), invokerName: connection.toConnector.invoker.name};
        const isSelectedBusinessItem = currentBusinessItem !== null;
        const isSelectedBusinessItemEmpty = isSelectedBusinessItem && currentBusinessItem.items.length === 0;
        if(isSelectedBusinessItemEmpty && !isAssignMode){
            fromConnectorPanelParams = null;
            toConnectorPanelParams = null;
        }
        return {fromConnectorPanelParams, toConnectorPanelParams};
    }

    render(){
        const {currentTechnicalItem, currentBusinessItem} = this.props;
        const isSelectedBusinessItem = currentBusinessItem !== null;
        const isSelectedBusinessItemEmpty = isSelectedBusinessItem && currentBusinessItem.items.length === 0;
        let isAssignMode = false;
        let svgStyle = {};
        if(isAssignMode){
            svgStyle.background = '#d7dcf2';
        }
        const isScalable = HAS_LAYOUTS_SCALING && !(isSelectedBusinessItemEmpty && !isAssignMode);
        const isDraggable = !(isSelectedBusinessItemEmpty && !isAssignMode);
        const {fromConnectorPanelParams, toConnectorPanelParams} = this.getPanelParams();
        return(
            <div id={this.layoutId} className={`${styles.technical_layout_extended}`}>
                <Svg
                    {...this.props}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isDraggable={isDraggable}
                    isScalable={isScalable}
                    setCurrentItem={::this.setCurrentItem}
                    deleteProcess={::this.deleteProcess}
                    currentItem={currentTechnicalItem}
                    style={svgStyle}
                    fromConnectorPanelParams={fromConnectorPanelParams}
                    toConnectorPanelParams={toConnectorPanelParams}
                />
            </div>
        );
    }
}

export default ExtendedTechnicalLayout;