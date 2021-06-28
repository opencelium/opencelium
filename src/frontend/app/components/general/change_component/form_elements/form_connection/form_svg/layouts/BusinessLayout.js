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
import {connect} from 'react-redux';
import {setCurrentBusinessItem, setItems} from "@actions/connection_overview_2/set";
import {mapItemsToClasses} from "../utils";
import Svg from "../layouts/Svg";
import styles from "@themes/default/content/connections/connection_overview_2";
import SettingsPanel from "../layouts/SettingsPanel";
import PropTypes from "prop-types";
import {setBusinessLayoutLocation} from "@actions/connection_overview_2/set";
import {PANEL_LOCATION, SEPARATE_WINDOW} from "@utils/constants/app";
import {NewWindowFeature} from "@decorators/NewWindowFeature";
import {connectionOverviewBusinessLayoutUrl} from "@utils/constants/url";
import {setLS} from "@utils/LocalStorage";
import CreateElementPanel from "../elements/create_element_panel/CreateElementPanel";
import {
    HAS_LAYOUTS_SCALING,
    LAYOUT_POSITION
} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";
import CSvg from "@classes/components/content/connection_overview_2/CSvg";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";


function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentBusinessItem, connection, updateConnection} = mapItemsToClasses(state);
    return{
        connectionOverviewState: connectionOverview,
        currentBusinessItem,
        technicalLayoutLocation: connectionOverview.get('technicalLayoutLocation'),
        businessLayoutLocation: connectionOverview.get('businessLayoutLocation'),
        connection,
        updateConnection,
    };
}

function isLocationSameWindow(props){
    return props.businessLayoutLocation === PANEL_LOCATION.SAME_WINDOW;
}

function setLocation(props, data){
    props.setBusinessLayoutLocation(data);
    props.maximizeTechnicalLayout();
}

@connect(mapStateToProps, {setCurrentBusinessItem, setBusinessLayoutLocation})
@NewWindowFeature({url: connectionOverviewBusinessLayoutUrl, windowName: SEPARATE_WINDOW.CONNECTION_OVERVIEW.BUSINESS_LAYOUT, setLocation, isLocationSameWindow})
class BusinessLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'business_layout';
    }

    setLocation(data){
        const {technicalLayoutLocation, setBusinessLayoutLocation} = this.props;
        if(technicalLayoutLocation === PANEL_LOCATION.SAME_WINDOW){
            setBusinessLayoutLocation(data);
        }
    }

    openInNewWindow(){
        setLS('connection_overview', this.props.connectionOverviewState.toJS(), 'connection_overview');
        this.props.openInNewWindow();
    }

    deleteProcess(process){
        const {connection, updateConnection, setCurrentBusinessItem} = this.props;
        connection.businessLayout.deleteItem(process);
        updateConnection(connection);
        const currentSvgElement = connection.businessLayout.getCurrentSvgItem()
        setCurrentBusinessItem(currentSvgElement);
    }

    render(){
        const {isCreateElementPanelOpened, createElementPanelConnectorType, setCreateElementPanelPosition} = this.props;
        const {
            isLayoutMinimized, maximizeLayout, minimizeLayout, replaceLayouts, setCurrentBusinessItem,
            detailsPosition, businessLayoutLocation, technicalLayoutLocation, isTechnicalLayoutMinimized,
            connection, ...svgProps} = this.props;
        const isReplaceIconDisabled = technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW;
        const isMinMaxIconDisabled = technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW || isTechnicalLayoutMinimized;
        const isNewWindowIconDisabled = technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW;
        const items = connection.businessLayout.getItems();
        const arrows = connection.businessLayout.getArrows();
        return(
            <div id={this.layoutId} className={`${styles.business_layout}`}>
                <SettingsPanel
                    isDisabled={isCreateElementPanelOpened}
                    openInNewWindow={::this.openInNewWindow}
                    isLayoutMinimized={isLayoutMinimized}
                    maximizeLayout={maximizeLayout}
                    minimizeLayout={minimizeLayout}
                    replaceLayouts={replaceLayouts}
                    detailsPosition={detailsPosition}
                    setLocation={::this.setLocation}
                    location={businessLayoutLocation}
                    title={'Business Layout'}
                    isReplaceIconDisabled={isReplaceIconDisabled}
                    isMinMaxIconDisabled={isMinMaxIconDisabled}
                    isNewWindowIconDisabled={isNewWindowIconDisabled}
                />
                <Svg
                    {...svgProps}
                    hasEmptyText={items.length === 0}
                    items={items}
                    arrows={arrows}
                    detailsPosition={detailsPosition}
                    setCurrentItem={setCurrentBusinessItem}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    dragAndDropStep={5}
                    isItemDraggable={true}
                    isDraggable={items.length > 0}
                    isScalable={items.length > 0 && HAS_LAYOUTS_SCALING}
                    setCreateElementPanelPosition={setCreateElementPanelPosition}
                    deleteProcess={::this.deleteProcess}
                />
            </div>
        );
    }
}

BusinessLayout.propTypes = {
    detailsPosition: PropTypes.oneOf(['right', 'left']).isRequired,
    isLayoutMinimized: PropTypes.bool.isRequired,
    isTechnicalLayoutMinimized: PropTypes.bool.isRequired,
    minimizeLayout: PropTypes.func.isRequired,
    maximizeLayout: PropTypes.func.isRequired,
    maximizeTechnicalLayout: PropTypes.func.isRequired,
    replaceLayouts: PropTypes.func.isRequired,
};

export default BusinessLayout;