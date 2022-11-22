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
import {setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {mapItemsToClasses} from "../utils";
import Svg from "./Svg";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {setTechnicalLayoutLocation} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {
    HAS_LAYOUTS_SCALING,
} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import CConnectorItem, {CONNECTOR_FROM, CONNECTOR_TO} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";


function mapStateToProps(state){
    const {connectionOverview, currentTechnicalItem, connection, updateConnection} = mapItemsToClasses(state);
    return{
        connectionOverviewState: connectionOverview,
        currentTechnicalItem,
        technicalLayoutLocation: connectionOverview.technicalLayoutLocation,
        connection,
    };
}


@connect(mapStateToProps, {setCurrentTechnicalItem, setTechnicalLayoutLocation})
class TechnicalLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'technical_layout';
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
                setCurrentTechnicalItem(currentSvgElement.getObject());
            }
        }
    }

    setCurrentItem(currentItem){
        if(currentItem) {
            const {setCurrentTechnicalItem, connection, updateConnection, currentTechnicalItem} = this.props;
            setCurrentTechnicalItem(currentItem.getObject());
            if (connection) {
                const connector = connection.getConnectorByType(currentItem.connectorType);
                const currentItemInConnector = connector.getCurrentItem();
                if (currentItemInConnector) {
                    if (currentItemInConnector.index !== currentItem.entity.index) {
                        connector.setCurrentItem(currentItem.entity);
                        updateConnection(connection);
                    }
                }
            }
        }
    }

    getPanelParams(allItems){
        const {connection} = this.props;
        let fromConnectorItems = [];
        let toConnectorItems = [];
        for(let i = 0; i < allItems.length; i++){
            if(allItems[i].connectorType === CONNECTOR_FROM){
                fromConnectorItems.push(allItems[i]);
            }
            if(allItems[i].connectorType === CONNECTOR_TO){
                toConnectorItems.push(allItems[i]);
            }
        }
        let fromConnectorPanelParams = {panelPosition: CConnectorItem.getPanelPosition(fromConnectorItems, connection.fromConnector.shiftXForSvgItems), rectPosition: CConnectorItem.getPanelRectPosition(fromConnectorItems, connection.fromConnector.shiftXForSvgItems), invokerName: connection.fromConnector.invoker.name};
        let toConnectorPanelParams = {panelPosition: CConnectorItem.getPanelPosition(toConnectorItems, connection.toConnector.shiftXForSvgItems), rectPosition: CConnectorItem.getPanelRectPosition(toConnectorItems, connection.toConnector.shiftXForSvgItems), invokerName: connection.toConnector.invoker.name};

        return {fromConnectorPanelParams, toConnectorPanelParams};
    }

    render(){
        const {setCreateElementPanelPosition} = this.props;
        const {
            connection, setCurrentTechnicalItem,
            currentTechnicalItem, ...svgProps
        } = this.props;
        const items = connection ? [...connection.fromConnector.svgItems, ...connection.toConnector.svgItems] : [];
        const {fromConnectorPanelParams, toConnectorPanelParams} = this.getPanelParams(items);
        let startingSvgY = -50;
        let svgStyle = {};
        return(
            <div id={this.layoutId} className={`${styles.technical_layout}`}>
                <Svg
                    {...svgProps}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isDraggable={true}
                    isScalable={HAS_LAYOUTS_SCALING}
                    isItemDraggable={true}
                    setCurrentItem={(a) => this.setCurrentItem(a)}
                    deleteProcess={(a) => this.deleteProcess(a)}
                    currentItem={currentTechnicalItem}
                    style={svgStyle}
                    connection={connection}
                    items={items}
                    dragAndDropStep={1}
                    arrows={[...connection.fromConnector.arrows, ...connection.toConnector.arrows]}
                    fromConnectorPanelParams={fromConnectorPanelParams}
                    toConnectorPanelParams={toConnectorPanelParams}
                    setCreateElementPanelPosition={setCreateElementPanelPosition}
                    startingSvgX={-250}
                    startingSvgY={startingSvgY}
                />
            </div>
        );
    }
}

TechnicalLayout.propTypes = {
};

TechnicalLayout.defaultProps = {
};

export default TechnicalLayout;