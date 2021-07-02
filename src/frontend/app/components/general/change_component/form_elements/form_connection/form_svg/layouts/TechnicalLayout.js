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
import PropTypes from "prop-types";
import SettingsPanel from "../layouts/SettingsPanel";
import styles from "@themes/default/content/connections/connection_overview_2";
import {setTechnicalLayoutLocation} from "@actions/connection_overview_2/set";
import {PANEL_LOCATION, SEPARATE_WINDOW} from "@utils/constants/app";
import {NewWindowFeature} from "@decorators/NewWindowFeature";
import {connectionOverviewTechnicalLayoutUrl} from "@utils/constants/url";
import {setLS} from "@utils/LocalStorage";
import CreateElementPanel from "../elements/create_element_panel/CreateElementPanel";
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";
import {
    HAS_LAYOUTS_SCALING,
    LAYOUT_POSITION
} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import CConnection from "@classes/components/content/connection/CConnection";
import CConnectorItem, {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import CSvg from "@classes/components/content/connection_overview_2/CSvg";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentTechnicalItem, currentBusinessItem, connection, updateConnection} = mapItemsToClasses(state);
    return{
        connectionOverviewState: connectionOverview,
        currentTechnicalItem,
        currentBusinessItem,
        technicalLayoutLocation: connectionOverview.get('technicalLayoutLocation'),
        businessLayoutLocation: connectionOverview.get('businessLayoutLocation'),
        connection,
            updateConnection,
            isAssignMode: connectionOverview.get('isAssignMode'),
    };
}

function isLocationSameWindow(props){
    return props.technicalLayoutLocation === PANEL_LOCATION.SAME_WINDOW;
}

function setLocation(props, data){
    props.setTechnicalLayoutLocation(data);
    props.maximizeBusinessLayout();
}

@connect(mapStateToProps, {setCurrentBusinessItem, setCurrentTechnicalItem, setTechnicalLayoutLocation})
@NewWindowFeature({url: connectionOverviewTechnicalLayoutUrl, windowName: SEPARATE_WINDOW.CONNECTION_OVERVIEW.TECHNICAL_LAYOUT, setLocation, isLocationSameWindow})
class TechnicalLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'technical_layout';
    }

    setLocation(data){
        const {businessLayoutLocation, setTechnicalLayoutLocation} = this.props;
        if(businessLayoutLocation === PANEL_LOCATION.SAME_WINDOW){
            setTechnicalLayoutLocation(data);
        }
    }

    openInNewWindow(){
        const {entity} = this.props;
        const items = [...entity.fromConnector.svgItems, ...entity.toConnector.svgItems];
        let convertedItems = [];
        if(items.length > 0 && (items[0] instanceof CProcess || items[0] instanceof COperator)){
            for(let i = 0; i < items.length; i++){
                convertedItems.push(items[i].getObject());
            }
        } else{
            convertedItems = items;
        }
        setLS('connection_overview', {...this.props.connectionOverviewState.toJS(), items: convertedItems, arrows: this.props.arrows}, 'connection_overview');
        this.props.openInNewWindow();
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

    setCurrentItem(currentItem){
        const {setCurrentTechnicalItem, connection, updateConnection} = this.props;
        setCurrentTechnicalItem(currentItem);
        if(connection) {
            const connector = connection.getConnectorByType(currentItem.connectorType);
            connector.setCurrentItem(currentItem.entity);
            updateConnection(connection);
        }
    }

    getItems(){
        const {connection, currentBusinessItem, isAssignMode} = this.props;
        const allItems = [...connection.fromConnector.svgItems, ...connection.toConnector.svgItems];
        let items;
        if(currentBusinessItem === null || isAssignMode) {
            items = allItems;
            if(isAssignMode){
                const businessLayoutItems = connection.businessLayout.getItems();
                for(let i = 0; i < businessLayoutItems.length; i++){
                    if(businessLayoutItems[i].id !== currentBusinessItem.id){
                        items = items.filter(item => businessLayoutItems[i].items.findIndex(technicalItem => technicalItem.id === item.id) === -1);
                    }
                }
            }
        } else{
            items = currentBusinessItem.items;
        }
        let xIterator = 0;
        let shiftXForSvgItems = 0;
        let firstItemId = items.length > 0 ? items[0].id : '0';
        let isFirstItem = true;
        for(let i = 0; i < items.length; i++){
            if(items[i].connectorType === CONNECTOR_FROM){
                shiftXForSvgItems = connection.fromConnector.shiftXForSvgItems;
            }
            if(items[i].connectorType === CONNECTOR_TO && shiftXForSvgItems !== connection.toConnector.shiftXForSvgItems){
                shiftXForSvgItems = connection.toConnector.shiftXForSvgItems;
                xIterator = 0;
                isFirstItem = true;
            }
            let currentSplitIndex = items[i].id.split('_');
            if(currentSplitIndex[currentSplitIndex.length - 1] !== '0' && !isFirstItem){
                xIterator += 200;
            }
            items[i].x = xIterator + shiftXForSvgItems;
            items[i].y = 150 * (currentSplitIndex.length - 2 - (firstItemId.split('_').length - 2));
            if(items[i].type && items.length !== 1){
                items[i].x += 35;
                items[i].y += 10;
            }
            isFirstItem = false;
        }
        return items;
    }

    getPanelParams(allItems){
        const {connection, isAssignMode, currentBusinessItem} = this.props;
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
        const isSelectedBusinessItem = currentBusinessItem !== null;
        const isSelectedBusinessItemEmpty = isSelectedBusinessItem && currentBusinessItem.items.length === 0;
        if(isSelectedBusinessItemEmpty && !isAssignMode){
            fromConnectorPanelParams = null;
            toConnectorPanelParams = null;
        }
        return {fromConnectorPanelParams, toConnectorPanelParams};
    }

    render(){
        const {isBusinessLayoutEmpty, updateConnection, isCreateElementPanelOpened, setCreateElementPanelPosition, isAssignMode} = this.props;
        const {
            isLayoutMinimized, maximizeLayout, minimizeLayout, replaceLayouts, businessLayoutLocation,
            detailsPosition, technicalLayoutLocation, isBusinessLayoutMinimized, connection, setCurrentTechnicalItem,
            currentTechnicalItem, currentBusinessItem, ...svgProps
        } = this.props;
        if(technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW || connection === null){
            return null;
        }
        const items = this.getItems();
        const {fromConnectorPanelParams, toConnectorPanelParams} = this.getPanelParams(items);
        const isSelectedBusinessItem = currentBusinessItem !== null;
        const isSelectedBusinessItemNotEmpty = isSelectedBusinessItem && currentBusinessItem.items.length !== 0;
        const isSelectedBusinessItemEmpty = isSelectedBusinessItem && currentBusinessItem.items.length === 0;
        const isReplaceIconDisabled = businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW;
        const isMinMaxIconDisabled = businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW || isBusinessLayoutMinimized;
        const isNewWindowIconDisabled = businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW || isBusinessLayoutMinimized;
        const startingSvgY = isBusinessLayoutEmpty ? -80 : -220;
        let svgStyle = {};
        let settingsPanelTitle = 'Technical Layout';
        if(isAssignMode){
            svgStyle.background = '#d7dcf2';
            settingsPanelTitle += ' (assign mode)';
        }
        return(
            <div id={this.layoutId} className={`${styles.technical_layout}`}>
                <SettingsPanel
                    isDisabled={isCreateElementPanelOpened}
                    updateConnection={updateConnection}
                    openInNewWindow={::this.openInNewWindow}
                    isLayoutMinimized={isLayoutMinimized}
                    maximizeLayout={maximizeLayout}
                    minimizeLayout={minimizeLayout}
                    replaceLayouts={replaceLayouts}
                    detailsPosition={detailsPosition}
                    setLocation={::this.setLocation}
                    location={technicalLayoutLocation}
                    title={settingsPanelTitle}
                    isReplaceIconDisabled={isReplaceIconDisabled}
                    isMinMaxIconDisabled={isMinMaxIconDisabled}
                    isNewWindowIconDisabled={isNewWindowIconDisabled}
                    hasConfigurationsIcon={true}
                />
                <Svg
                    {...svgProps}
                    style={svgStyle}
                    currentItem={currentTechnicalItem}
                    isBusinessLayoutMinimized={isBusinessLayoutMinimized}
                    detailsPosition={detailsPosition}
                    setCurrentItem={::this.setCurrentItem}
                    connection={connection}
                    items={items}
                    arrows={[...connection.fromConnector.arrows, ...connection.toConnector.arrows]}
                    fromConnectorPanelParams={fromConnectorPanelParams}
                    toConnectorPanelParams={toConnectorPanelParams}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isItemDraggable={false}
                    isScalable={HAS_LAYOUTS_SCALING}
                    setCreateElementPanelPosition={setCreateElementPanelPosition}
                    startingSvgY={startingSvgY}
                    deleteProcess={::this.deleteProcess}
                    hasAssignCentralText={isSelectedBusinessItemEmpty}
                    isDraggable={!(isSelectedBusinessItemEmpty && !isAssignMode)}
                />
            </div>
        );
    }
}

TechnicalLayout.propTypes = {
    detailsPosition: PropTypes.oneOf(['right', 'left']).isRequired,
    isLayoutMinimized: PropTypes.bool.isRequired,
    isBusinessLayoutMinimized: PropTypes.bool.isRequired,
    minimizeLayout: PropTypes.func.isRequired,
    maximizeLayout: PropTypes.func.isRequired,
    maximizeBusinessLayout: PropTypes.func.isRequired,
    replaceLayouts: PropTypes.func.isRequired,
    isDetailsMinimized: PropTypes.bool,
    isBusinessLayoutEmpty: PropTypes.bool,
};

TechnicalLayout.defaultProps = {
    isDetailsMinimized: false,
    isBusinessLayoutEmpty: false,
};

export default TechnicalLayout;