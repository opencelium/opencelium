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
import {setCurrentItem, setItems} from "@actions/connection_overview_2/set";
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
import CreateElementPanel from "../elements/CreateElementPanel";


function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentItem} = mapItemsToClasses(state);
    return{
        connectionOverviewState: connectionOverview,
        currentItem,
        technicalLayoutLocation: connectionOverview.get('technicalLayoutLocation'),
        businessLayoutLocation: connectionOverview.get('businessLayoutLocation'),
    };
}

function isLocationSameWindow(props){
    return props.businessLayoutLocation === PANEL_LOCATION.SAME_WINDOW;
}

function setLocation(props, data){
    props.setBusinessLayoutLocation(data);
    props.maximizeTechnicalLayout();
}

@connect(mapStateToProps, {setCurrentItem, setItems, setBusinessLayoutLocation})
@NewWindowFeature({url: connectionOverviewBusinessLayoutUrl, windowName: SEPARATE_WINDOW.CONNECTION_OVERVIEW.BUSINESS_LAYOUT, setLocation, isLocationSameWindow})
class BusinessLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'business_layout';
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
        const {technicalLayoutLocation, setBusinessLayoutLocation} = this.props;
        if(technicalLayoutLocation === PANEL_LOCATION.SAME_WINDOW){
            setBusinessLayoutLocation(data);
        }
    }

    openInNewWindow(){
        setLS('connection_overview', this.props.connectionOverviewState.toJS(), 'connection_overview');
        this.props.openInNewWindow();
    }

    render(){
        const {createElementPanelPosition} = this.state;
        const {currentItem, items} = this.props;
        const {
            isLayoutMinimized, maximizeLayout, minimizeLayout, replaceLayouts,
            detailsPosition, businessLayoutLocation, technicalLayoutLocation, isTechnicalLayoutMinimized,
            ...svgProps} = this.props;
        const isReplaceIconDisabled = technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW;
        const isMinMaxIconDisabled = technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW || isTechnicalLayoutMinimized || items.length === 0;
        const isNewWindowIconDisabled = technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW || items.length === 0;
        return(
            <div id={this.layoutId} className={`${styles.business_layout}`}>
                <SettingsPanel
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
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    dragAndDropStep={5}
                    isDraggable={true}
                    isScalable={false}
                    setCreateElementPanelPosition={::this.setCreateElementPanelPosition}
                />
                <CreateElementPanel x={createElementPanelPosition.x} y={createElementPanelPosition.y} currentItem={currentItem}/>
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