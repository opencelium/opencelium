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
import {setCurrentItem, setCurrentSubItem} from "@actions/connection_overview_2/set";
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
import CreateElementPanel from "../elements/CreateElementPanel";
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";
import {HAS_LAYOUTS_SCALING} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentItem, currentSubItem} = mapItemsToClasses(state);
    return{
        connectionOverviewState: connectionOverview,
        currentItem,
        currentSubItem,
        technicalLayoutLocation: connectionOverview.get('technicalLayoutLocation'),
        businessLayoutLocation: connectionOverview.get('businessLayoutLocation'),
    };
}

function isLocationSameWindow(props){
    return props.technicalLayoutLocation === PANEL_LOCATION.SAME_WINDOW;
}

function setLocation(props, data){
    props.setTechnicalLayoutLocation(data);
    props.maximizeBusinessLayout();
}

@connect(mapStateToProps, {setCurrentItem, setCurrentSubItem, setTechnicalLayoutLocation})
@NewWindowFeature({url: connectionOverviewTechnicalLayoutUrl, windowName: SEPARATE_WINDOW.CONNECTION_OVERVIEW.TECHNICAL_LAYOUT, setLocation, isLocationSameWindow})
class TechnicalLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'technical_layout';
        this.state = {
            createElementPanelPosition: {x: 0, y: 0},
        }
    }

    setCreateElementPanelPosition(position){
        this.setState({
            createElementPanelPosition: position,
        });
    }

    setLocation(data){
        const {businessLayoutLocation, setTechnicalLayoutLocation} = this.props;
        if(businessLayoutLocation === PANEL_LOCATION.SAME_WINDOW){
            setTechnicalLayoutLocation(data);
        }
    }

    openInNewWindow(){
        const {items} = this.props;
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

    render(){
        const {createElementPanelPosition} = this.state;
        const {currentSubItem, isBusinessLayoutEmpty} = this.props;
        const {
            isLayoutMinimized, maximizeLayout, minimizeLayout, replaceLayouts, businessLayoutLocation,
            detailsPosition, technicalLayoutLocation, isBusinessLayoutMinimized,
            ...svgProps
        } = this.props;
        if(technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW){
            return null;
        }
        const isReplaceIconDisabled = businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW;
        const isMinMaxIconDisabled = businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW || isBusinessLayoutMinimized;
        const isNewWindowIconDisabled = businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW || isBusinessLayoutMinimized;
        const startingSvgY = isBusinessLayoutEmpty ? -10 : -190;
        return(
            <div id={this.layoutId} className={`${styles.technical_layout}`}>
                <SettingsPanel
                    openInNewWindow={::this.openInNewWindow}
                    isLayoutMinimized={isLayoutMinimized}
                    maximizeLayout={maximizeLayout}
                    minimizeLayout={minimizeLayout}
                    replaceLayouts={replaceLayouts}
                    detailsPosition={detailsPosition}
                    setLocation={::this.setLocation}
                    location={technicalLayoutLocation}
                    title={'Technical Layout'}
                    isReplaceIconDisabled={isReplaceIconDisabled}
                    isMinMaxIconDisabled={isMinMaxIconDisabled}
                    isNewWindowIconDisabled={isNewWindowIconDisabled}
                />
                <Svg
                    {...svgProps}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isDraggable={false}
                    isScalable={HAS_LAYOUTS_SCALING}
                    setCreateElementPanelPosition={::this.setCreateElementPanelPosition}
                    startingSvgY={startingSvgY}
                />
                <CreateElementPanel x={createElementPanelPosition.x} y={createElementPanelPosition.y} currentItem={currentSubItem}/>
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
    isBusinessLayoutEmpty: true,
};

export default TechnicalLayout;