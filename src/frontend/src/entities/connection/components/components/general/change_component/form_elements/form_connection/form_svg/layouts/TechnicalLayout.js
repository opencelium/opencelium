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
import {setCurrentBusinessItem, setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {mapItemsToClasses} from "../utils";
import Svg from "./Svg";
import PropTypes from "prop-types";
import SettingsPanel from "./SettingsPanel";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {setTechnicalLayoutLocation, setIsVisibleBusinessLabelKeyPressed} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {PANEL_LOCATION, SEPARATE_WINDOW} from "@entity/connection/components/utils/constants/app";
import {NewWindowFeature} from "@entity/connection/components/decorators/NewWindowFeature";
import {connectionOverviewTechnicalLayoutUrl} from "@entity/connection/components/utils/constants/url";
import CProcess from "@entity/connection/components/classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@entity/connection/components/classes/components/content/connection_overview_2/operator/COperator";
import {
    HAS_LAYOUTS_SCALING,
} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import CConnectorItem, {CONNECTOR_FROM, CONNECTOR_TO} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import {
    addHideBusinessLabelKeyNavigation,
    addShowBusinessLabelKeyNavigation, removeHideBusinessLabelKeyNavigation,
    removeShowBusinessLabelKeyNavigation
} from "@entity/connection/components/utils/key_navigation";
import {LocalStorage} from "@application/classes/LocalStorage";

function mapStateToProps(state){
    const {connectionOverview, currentTechnicalItem, currentBusinessItem, connection, updateConnection} = mapItemsToClasses(state);
    return{
        connectionOverviewState: connectionOverview,
        currentTechnicalItem,
        currentBusinessItem,
        technicalLayoutLocation: connectionOverview.technicalLayoutLocation,
        businessLayoutLocation: connectionOverview.businessLayoutLocation,
        businessLabelMode: connectionOverview.businessLabelMode,
        isVisibleBusinessLabelKeyPressed: connectionOverview.isVisibleBusinessLabelKeyPressed,
        connection,
    };
}

function isLocationSameWindow(props){
    return props.technicalLayoutLocation === PANEL_LOCATION.SAME_WINDOW;
}

function setLocation(props, data){
    props.setTechnicalLayoutLocation(data);
    props.maximizeBusinessLayout();
}

@connect(mapStateToProps, {setCurrentBusinessItem, setCurrentTechnicalItem, setTechnicalLayoutLocation, setIsVisibleBusinessLabelKeyPressed})
@NewWindowFeature({url: connectionOverviewTechnicalLayoutUrl, windowName: SEPARATE_WINDOW.CONNECTION_OVERVIEW.TECHNICAL_LAYOUT, setLocation, isLocationSameWindow})
class TechnicalLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'technical_layout';
    }

    componentDidMount() {
        addShowBusinessLabelKeyNavigation(this);
        addHideBusinessLabelKeyNavigation(this);
    }

    componentWillUnmount() {
        removeShowBusinessLabelKeyNavigation(this);
        removeHideBusinessLabelKeyNavigation(this);
    }

    setLocation(data){
        const {businessLayoutLocation, setTechnicalLayoutLocation} = this.props;
        if(businessLayoutLocation === PANEL_LOCATION.SAME_WINDOW){
            setTechnicalLayoutLocation(data);
        }
    }

    openInNewWindow(){
        const {connection} = this.props;
        const items = connection ? [...connection.fromConnector.svgItems, ...connection.toConnector.svgItems] : [];
        let convertedItems = [];
        if(items.length > 0 && (items[0] instanceof CProcess || items[0] instanceof COperator)){
            for(let i = 0; i < items.length; i++){
                convertedItems.push(items[i].getObject());
            }
        } else{
            convertedItems = items;
        }
        const storage = LocalStorage.getStorage();
        storage.set('connection_overview', {...this.props.connectionOverviewState, items: convertedItems, arrows: this.props.arrows});
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
                setCurrentTechnicalItem(currentSvgElement.getObject());
            }
        }
    }

    setCurrentItem(currentItem){
        const {setCurrentTechnicalItem, connection, updateConnection} = this.props;
        setCurrentTechnicalItem(currentItem.getObject());
        if(connection) {
            const connector = connection.getConnectorByType(currentItem.connectorType);
            connector.setCurrentItem(currentItem.entity);
            updateConnection(connection);
        }
    }

    getPanelParams(allItems){
        const {connection, currentBusinessItem} = this.props;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
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
        const {isBusinessLayoutEmpty, updateConnection, isCreateElementPanelOpened, setCreateElementPanelPosition} = this.props;
        const {
            isLayoutMinimized, maximizeLayout, minimizeLayout, replaceLayouts, businessLayoutLocation,
            detailsPosition, technicalLayoutLocation, isBusinessLayoutMinimized, connection, setCurrentTechnicalItem,
            currentTechnicalItem, currentBusinessItem, ...svgProps
        } = this.props;
        if(technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW || connection === null){
            return null;
        }
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
        const items = connection ? [...connection.fromConnector.svgItems, ...connection.toConnector.svgItems] : [];
        const {fromConnectorPanelParams, toConnectorPanelParams} = this.getPanelParams(items);
        const isSelectedBusinessItem = currentBusinessItem !== null;
        const isSelectedBusinessItemNotEmpty = isSelectedBusinessItem && currentBusinessItem.items.length !== 0;
        const isSelectedBusinessItemEmpty = isSelectedBusinessItem && currentBusinessItem.items.length === 0;
        const isReplaceIconDisabled = businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW;
        const isMinMaxIconDisabled = businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW || isBusinessLayoutMinimized;
        const isNewWindowIconDisabled = businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW || isBusinessLayoutMinimized;
        let startingSvgX = isBusinessLayoutMinimized ? -250 : -40;
        let startingSvgY = isBusinessLayoutMinimized ? -280 : -150;
        let svgStyle = {};
        let settingsPanelTitle = 'Technical Layout';
        if(isAssignMode){
            svgStyle.background = '#00acc2';
            settingsPanelTitle += ' (assign mode)';
        }
        return(
            <div id={this.layoutId} className={`${styles.technical_layout}`}>
                <SettingsPanel
                    isDisabled={isCreateElementPanelOpened}
                    updateConnection={updateConnection}
                    openInNewWindow={(a) => this.openInNewWindow(a)}
                    isLayoutMinimized={isLayoutMinimized}
                    maximizeLayout={maximizeLayout}
                    minimizeLayout={minimizeLayout}
                    replaceLayouts={replaceLayouts}
                    detailsPosition={detailsPosition}
                    setLocation={(a) => this.setLocation(a)}
                    location={technicalLayoutLocation}
                    title={settingsPanelTitle}
                    isReplaceIconDisabled={isReplaceIconDisabled}
                    isMinMaxIconDisabled={isMinMaxIconDisabled}
                    isNewWindowIconDisabled={isNewWindowIconDisabled}
                    hasConfigurationsIcon={true}
                />
                <Svg
                    {...svgProps}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isDraggable={!(isSelectedBusinessItemEmpty && !isAssignMode)}
                    isScalable={HAS_LAYOUTS_SCALING && !(isSelectedBusinessItemEmpty && !isAssignMode)}
                    isItemDraggable={false}
                    setCurrentItem={(a) => this.setCurrentItem(a)}
                    deleteProcess={(a) => this.deleteProcess(a)}
                    currentItem={currentTechnicalItem}
                    style={svgStyle}
                    isBusinessLayoutMinimized={isBusinessLayoutMinimized}
                    detailsPosition={detailsPosition}
                    connection={connection}
                    items={items}
                    arrows={[...connection.fromConnector.arrows, ...connection.toConnector.arrows]}
                    fromConnectorPanelParams={fromConnectorPanelParams}
                    toConnectorPanelParams={toConnectorPanelParams}
                    setCreateElementPanelPosition={setCreateElementPanelPosition}
                    startingSvgX={startingSvgX}
                    startingSvgY={startingSvgY}
                    hasAssignCentralText={isSelectedBusinessItemEmpty && !isAssignMode}
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