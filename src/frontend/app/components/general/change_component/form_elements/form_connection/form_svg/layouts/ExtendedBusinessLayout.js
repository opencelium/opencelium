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
import {
    setConnectionData,
    setCurrentBusinessItem,
    setTechnicalLayoutLocation
} from "@actions/connection_overview_2/set";
import {mapItemsToClasses} from "../utils";
import Svg from "../layouts/Svg";
import styles from "@themes/default/content/connections/connection_overview_2";
import {setBusinessLayoutLocation} from "@actions/connection_overview_2/set";
import CreateElementPanel from "../elements/create_element_panel/CreateElementPanel";
import {HAS_LAYOUTS_SCALING} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import {ConnectionOverviewExtendedChannel} from "@utils/store";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {connection, currentBusinessItem} = mapItemsToClasses(state);
    return{
        currentBusinessItem,
        connection,
        updateConnectionInOpener: window.opener.updateConnection,
        items: connection.businessLayout.getItems(),
        arrows: connection.businessLayout.getArrows(),
        technicalLayoutLocation: connectionOverview.get('technicalLayoutLocation'),
        businessLayoutLocation: connectionOverview.get('businessLayoutLocation'),
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

    componentDidMount() {
        ConnectionOverviewExtendedChannel.onmessage = (e) => ::this.props.setConnectionData(e.data);
    }

    updateConnection(connection){
        const {updateConnectionInOpener, setConnectionData} = this.props;
        updateConnectionInOpener(connection);
        setConnectionData(connection);
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
        setCurrentBusinessItem(currentItem);
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
        setCurrentBusinessItem(currentSvgElement);
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
                    updateConnection={::this.updateConnection}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isDraggable={items.length > 0}
                    isScalable={items.length > 0 && HAS_LAYOUTS_SCALING}
                    setCurrentItem={::this.setCurrentItem}
                    deleteProcess={::this.deleteProcess}
                    currentItem={currentBusinessItem}
                    updateItems={::this.updateItems}
                    hasCreateCentralText={items.length === 0}
                    dragAndDropStep={5}
                    isItemDraggable={true}
                    setCreateElementPanelPosition={::this.setCreateElementPanelPosition}
                    setIsCreateElementPanelOpened={::this.setIsCreateElementPanelOpened}
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
                    updateConnection={::this.updateConnection}
                    isCreateElementPanelOpened={isCreateElementPanelOpened}
                    setCreateElementPanelPosition={::this.setCreateElementPanelPosition}
                    setIsCreateElementPanelOpened={::this.setIsCreateElementPanelOpened}
                />
            </div>
        );
    }
}

export default ExtendedBusinessLayout;