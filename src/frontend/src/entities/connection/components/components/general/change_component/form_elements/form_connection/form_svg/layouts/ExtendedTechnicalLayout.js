/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {connect} from "react-redux";
import {mapItemsToClasses} from "../utils";
import Svg from "./Svg";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import CConnectorItem, {CONNECTOR_FROM, CONNECTOR_TO} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import {
    HAS_LAYOUTS_SCALING,
} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import CreateElementPanel
    from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/CreateElementPanel";
import {setCurrentBusinessItem, setCurrentTechnicalItem, setTechnicalLayoutLocation, setConnectionData} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";

function mapStateToProps(state){
    const {currentBusinessItem, currentTechnicalItem, connection} = mapItemsToClasses(state);
    let arrows = connection ? [...connection.fromConnector.arrows, ...connection.toConnector.arrows] : [];
    const items = connection ? [...connection.fromConnector.svgItems, ...connection.toConnector.svgItems] : [];
    return{
        currentBusinessItem,
        currentTechnicalItem,
        items,
        arrows,
        connection,
    };
}

@connect(mapStateToProps, {setCurrentBusinessItem, setCurrentTechnicalItem, setTechnicalLayoutLocation, setConnectionData})
class ExtendedTechnicalLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'technical_layout';
        this.state = {
            isCreateElementPanelOpened: false,
            createElementPanelConnectorType: '',
            createElementPanelPosition: {x: 0, y: 0},
        }
    }

    updateConnection(connection){
        this.props.setConnectionData({connection: connection.getObjectForConnectionOverview()});
    }

    setCreateElementPanelPosition(position){
        this.setState({
            createElementPanelPosition: position,
        });
    }

    setIsCreateElementPanelOpened(isCreateElementPanelOpened, createElementPanelConnectorType = ''){
        this.setState({
            isCreateElementPanelOpened,
            createElementPanelConnectorType,
        });
    }

    setCurrentItem(currentItem){
        const {setCurrentTechnicalItem, connection} = this.props;
        setCurrentTechnicalItem(currentItem.getObject());
        if(connection) {
            const connector = connection.getConnectorByType(currentItem.connectorType);
            connector.setCurrentItem(currentItem.entity);
            this.updateConnection(connection);
        }
    }

    deleteProcess(process){
        const {connection, setCurrentTechnicalItem} = this.props;
        const method = process.entity;
        const connector = connection.getConnectorByType(process.connectorType);
        if(connector){
            if(connector.getConnectorType() === CONNECTOR_FROM){
                connection.removeFromConnectorMethod(method);
            } else{
                connection.removeToConnectorMethod(method);
            }
            const currentItem = connector.getCurrentItem();
            if(currentItem){
                const currentSvgElement = connector.getSvgElementByIndex(currentItem.index);
                setCurrentTechnicalItem(currentSvgElement.getObject());
            }
            this.updateConnection(connection);
        }
    }

    getPanelParams(){
        const {items, connection, currentBusinessItem} = this.props;
        let isAssignMode = connection && connection.businessLayout.isInAssignMode;
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
        const {createElementPanelPosition, createElementPanelConnectorType, isCreateElementPanelOpened} = this.state;
        const {currentTechnicalItem, currentBusinessItem, connection} = this.props;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
        const isSelectedBusinessItem = currentBusinessItem !== null;
        const isSelectedBusinessItemEmpty = isSelectedBusinessItem && currentBusinessItem.items.length === 0;
        let svgStyle = {};
        if(isAssignMode){
            svgStyle.background = '#00acc2';
        }
        const isScalable = HAS_LAYOUTS_SCALING && !(isSelectedBusinessItemEmpty && !isAssignMode);
        const isDraggable = !(isSelectedBusinessItemEmpty && !isAssignMode);
        const hasAssignCentralText = isSelectedBusinessItemEmpty && !isAssignMode;
        const {fromConnectorPanelParams, toConnectorPanelParams} = this.getPanelParams();
        return(
            <div id={this.layoutId} className={`${styles.technical_layout_extended}`}>
                <Svg
                    {...this.props}
                    updateConnection={(a) => this.updateConnection(a)}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isDraggable={isDraggable}
                    isScalable={isScalable}
                    isItemDraggable={false}
                    setCurrentItem={(a) => this.setCurrentItem(a)}
                    deleteProcess={(a) => this.deleteProcess(a)}
                    currentItem={currentTechnicalItem}
                    style={svgStyle}
                    isBusinessLayoutMinimized={false}
                    fromConnectorPanelParams={fromConnectorPanelParams}
                    toConnectorPanelParams={toConnectorPanelParams}
                    setCreateElementPanelPosition={(a) => this.setCreateElementPanelPosition(a)}
                    setIsCreateElementPanelOpened={(a, b) => this.setIsCreateElementPanelOpened(a, b)}
                    startingSvgX={-200}
                    startingSvgY={-80}
                    hasAssignCentralText={hasAssignCentralText}
                />
                <CreateElementPanel
                    isOnTheTopLayout={true}
                    createElementPanelConnectorType={createElementPanelConnectorType}
                    x={createElementPanelPosition.x}
                    y={createElementPanelPosition.y}
                    connectorType={currentTechnicalItem ? currentTechnicalItem.connectorType : ''}
                    connection={connection}
                    updateConnection={(a) => this.updateConnection(a)}
                    isCreateElementPanelOpened={isCreateElementPanelOpened}
                    setCreateElementPanelPosition={(a) => this.setCreateElementPanelPosition(a)}
                    setIsCreateElementPanelOpened={(a, b) => this.setIsCreateElementPanelOpened(a, b)}
                />
            </div>
        );
    }
}

export default ExtendedTechnicalLayout;