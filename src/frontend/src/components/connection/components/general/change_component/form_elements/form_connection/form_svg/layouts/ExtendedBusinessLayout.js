/*
 * Copyright (C) <2022>  <becon GmbH>
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
import {mapItemsToClasses} from "../utils";
import Svg from "../layouts/Svg";
import styles from "@themes/default/content/connections/connection_overview_2";
import CreateElementPanel from "../elements/create_element_panel/CreateElementPanel";
import {HAS_LAYOUTS_SCALING} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import {setConnectionData, setCurrentBusinessItem, setBusinessLayoutLocation} from "@slice/connection/ConnectionSlice";

function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const {connection, currentBusinessItem} = mapItemsToClasses(state);
    return{
        currentBusinessItem,
        connection,
        items: connection.businessLayout.getItems(),
        arrows: connection.businessLayout.getArrows(),
        technicalLayoutLocation: connectionOverview.technicalLayoutLocation,
        businessLayoutLocation: connectionOverview.businessLayoutLocation,
    };
}

@connect(mapStateToProps, {setCurrentBusinessItem, setBusinessLayoutLocation, setConnectionData})
class ExtendedBusinessLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'business_layout';
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
        const {setCurrentBusinessItem, connection} = this.props;
        setCurrentBusinessItem(currentItem ? currentItem.getObject() : currentItem);
        if(connection) {
            connection.businessLayout.setCurrentSvgItem(currentItem);
            this.updateConnection(connection);
        }
    }

    deleteProcess(process){
        const {connection, setCurrentBusinessItem} = this.props;
        connection.businessLayout.deleteItem(process);
        this.updateConnection(connection);
        const currentSvgElement = connection.businessLayout.getCurrentSvgItem()
        setCurrentBusinessItem(currentSvgElement.getObject());
    }

    updateItems(items){
        const {connection} = this.props;
        connection.businessLayout.setItems(items);
        this.updateConnection(connection);
    }

    render(){
        const {items, currentBusinessItem, currentTechnicalItem, connection} = this.props;
        const {createElementPanelPosition, createElementPanelConnectorType, isCreateElementPanelOpened} = this.state;
        return(
            <div id={this.layoutId} className={`${styles.business_layout_extended}`}>
                <Svg
                    {...this.props}
                    updateConnection={(a) => this.updateConnection(a)}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isDraggable={items.length > 0}
                    isScalable={items.length > 0 && HAS_LAYOUTS_SCALING}
                    setCurrentItem={(a) => this.setCurrentItem(a)}
                    deleteProcess={(a) => this.deleteProcess(a)}
                    currentItem={currentBusinessItem}
                    updateItems={(a) => this.updateItems(a)}
                    hasCreateCentralText={items.length === 0}
                    dragAndDropStep={5}
                    isItemDraggable={true}
                    setCreateElementPanelPosition={(a) => this.setCreateElementPanelPosition(a)}
                    setIsCreateElementPanelOpened={(a, b) => this.setIsCreateElementPanelOpened(a, b)}
                    shouldUnselectOnDraggingPanel={true}
                    startingSvgX={-100}
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

export default ExtendedBusinessLayout;