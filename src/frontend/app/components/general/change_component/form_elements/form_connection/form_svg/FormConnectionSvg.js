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

import React, {Component} from 'react';
import {connect} from 'react-redux';
import PanelGroup from 'react-panelgroup';
import BusinessLayout from "./layouts/BusinessLayout";
import TechnicalLayout from "./layouts/TechnicalLayout";
import Details from "./details/Details";

import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {PANEL_LOCATION} from "@utils/constants/app";


export const HAS_LAYOUTS_SCALING = false;

export const LAYOUT_POSITION = {
    TOP: 'top',
    BOTTOM: 'bottom',
};

export const DETAILS_POSITION = {
    RIGHT: 'right',
    LEFT: 'left',
};

export const  LAYOUT_SETTINGS = {
    MIN_WIDTH: 200,
};

const INITIAL_BUSINESS_LAYOUT_POSITION = LAYOUT_POSITION.TOP;
const INITIAL_TECHNICAL_LAYOUT_POSITION = LAYOUT_POSITION.BOTTOM;
const INITIAL_DETAILS_POSITION = DETAILS_POSITION.RIGHT;

const BUSINESS_DATA = {processes: [], arrows: []};

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        technicalLayoutLocation: connectionOverview.get('technicalLayoutLocation'),
        businessLayoutLocation: connectionOverview.get('businessLayoutLocation'),
    };
}

/**
 * Layout for TemplateConverter
 */
@connect(mapStateToProps, {})
class FormConnectionSvg extends Component{

    constructor(props){
        super(props);

        this.state = {
            businessLayoutPosition: INITIAL_BUSINESS_LAYOUT_POSITION,
            technicalLayoutPosition: INITIAL_TECHNICAL_LAYOUT_POSITION,
            detailsPosition: INITIAL_DETAILS_POSITION,
            verticalPanelWidths: ::this.getPanelGroupWidths(),
            isDetailsMinimized: false,
            isBusinessLayoutMinimized: false,
            isTechnicalLayoutMinimized: false,
            businessViewBoxYOffset: 0,
            technicalViewBoxYOffset: 0,
            businessLayoutHeight: 300,
            technicalLayoutHeight: 300,
        }
        this.hasInitialPanelGroupSizes = false;
        this.initialBusinessSize = 300;
        this.initialTechnicalSize = 300;
    }

    componentDidMount() {
        if(BUSINESS_DATA.processes.length === 0 && this.props.entity.toConnector.processes.length !== 0) {
            this.minimizeBusinessLayout();
        }
    }

    moveDetailsLeft(){
        this.setState({
            detailsPosition: DETAILS_POSITION.LEFT,
        });
    }

    moveDetailsRight(){
        this.setState({
            detailsPosition: DETAILS_POSITION.RIGHT,
        });
    }

    minimizeDetails(){
        this.setState({
            isDetailsMinimized: true,
        });
    }

    maximizeDetails(){
        this.setState({
            isDetailsMinimized: false,
        });
    }

    minimizeTechnicalLayout(){
        if(!this.state.isBusinessLayoutMinimized && this.props.businessLayoutLocation === PANEL_LOCATION.SAME_WINDOW) {
            let technicalLayoutHeight = this.state.technicalLayoutPosition === LAYOUT_POSITION.TOP ? this.state.verticalPanelWidths[0].size : this.state.verticalPanelWidths[1].size;
            this.setState({
                isTechnicalLayoutMinimized: true,
                verticalPanelWidths: ::this.getPanelGroupWidths({layoutOne: true, layoutTwo: this.state.isBusinessLayoutMinimized}, this.state.technicalLayoutPosition, this.state.technicalLayoutHeight),
                technicalLayoutHeight,
            });
        } else{
            alert('Two panels cannot be minified');
        }
    }

    maximizeTechnicalLayout(){
        this.setState({
            isTechnicalLayoutMinimized: false,
            verticalPanelWidths: ::this.getPanelGroupWidths({layoutOne: false, layoutTwo: this.state.isBusinessLayoutMinimized}, this.state.technicalLayoutPosition, this.state.technicalLayoutHeight),
        });
    }

    minimizeBusinessLayout(){
        const {isTechnicalLayoutMinimized, businessLayoutPosition, verticalPanelWidths, businessLayoutHeight} = this.state;
        const {technicalLayoutLocation} = this.props;
        if(!isTechnicalLayoutMinimized && technicalLayoutLocation === PANEL_LOCATION.SAME_WINDOW) {
            let newBusinessLayoutHeight = businessLayoutPosition === LAYOUT_POSITION.TOP ? verticalPanelWidths[0].size : verticalPanelWidths[1].size;
            this.setState({
                isBusinessLayoutMinimized: true,
                verticalPanelWidths: ::this.getPanelGroupWidths({layoutTwo: isTechnicalLayoutMinimized, layoutOne: true}, businessLayoutPosition, businessLayoutHeight),
                businessLayoutHeight: newBusinessLayoutHeight,
            });
        } else{
            alert('Two panels cannot be minified');
        }
    }

    maximizeBusinessLayout(){
        this.setState({
            isBusinessLayoutMinimized: false,
            verticalPanelWidths: ::this.getPanelGroupWidths({layoutTwo: this.state.isTechnicalLayoutMinimized, layoutOne: false}, this.state.businessLayoutPosition, this.state.businessLayoutHeight),
        });
    }

    onUpdatePanelGroupParams(panels){
        const {businessLayoutPosition, technicalLayoutPosition, businessViewBoxYOffset, technicalViewBoxYOffset} = this.state;
        let businessPanel = businessLayoutPosition === LAYOUT_POSITION.TOP ? panels[0] : panels[1];
        let technicalPanel = technicalLayoutPosition === LAYOUT_POSITION.TOP ? panels[0] : panels[1];
        if(!this.hasInitialPanelGroupSizes){
            this.initialBusinessSize = businessPanel.size;
            this.initialTechnicalSize = technicalPanel.size;
            this.hasInitialPanelGroupSizes = true;
        }
        let newBusinessViewBoxYOffset = (businessPanel.size - this.initialBusinessSize) / 1.7;
        let newTechnicalViewBoxYOffset = (technicalPanel.size - this.initialTechnicalSize) / 1.7;
        if(businessViewBoxYOffset !== newBusinessViewBoxYOffset){
            const svg = document.getElementById('business_layout_svg');
            if(svg) {
                let viewBox = svg.viewBox.baseVal;
                if (viewBox) viewBox.y = viewBox.y - businessViewBoxYOffset + newBusinessViewBoxYOffset;
            }
        }
        if(technicalViewBoxYOffset !== newTechnicalViewBoxYOffset){
            const svg = document.getElementById('technical_layout_svg');
            if(svg) {
                let viewBox = svg.viewBox.baseVal;
                if (viewBox) viewBox.y = viewBox.y - technicalViewBoxYOffset + newTechnicalViewBoxYOffset;
            }
        }
        this.setState({
            businessViewBoxYOffset: newBusinessViewBoxYOffset,
            technicalViewBoxYOffset: newTechnicalViewBoxYOffset,
            verticalPanelWidths: [...panels],
        });
    }

    getPanelGroupWidths(isMinimized = {layoutOne: false, layoutTwo: false}, layoutPosition = LAYOUT_POSITION.BOTTOM, height = 300){
        let technicalLayoutLocation = this.props ? this.props.technicalLayoutLocation : PANEL_LOCATION.SAME_WINDOW;
        let businessLayoutLocation = this.props ? this.props.businessLayoutLocation : PANEL_LOCATION.SAME_WINDOW;
        let panelWidths = [
            {minSize: LAYOUT_SETTINGS.MIN_WIDTH,},
            {minSize: LAYOUT_SETTINGS.MIN_WIDTH,},
        ];
        if(isMinimized.layoutOne){
            if(layoutPosition === LAYOUT_POSITION.TOP){
                panelWidths[0].maxSize = 20;
                panelWidths[0].minSize = 20;
                panelWidths[0].size = 20;
            }
            if(layoutPosition === LAYOUT_POSITION.BOTTOM){
                panelWidths[1].maxSize = 20;
                panelWidths[1].minSize = 20;
                panelWidths[1].size = 20;
            }
        } else{
            if(layoutPosition === LAYOUT_POSITION.TOP){
                if(isMinimized.layoutTwo){
                    panelWidths[1].maxSize = 20;
                    panelWidths[1].minSize = 20;
                    panelWidths[1].size = 20;
                } else{
                    panelWidths[0].size = height;
                }
            }
            if(layoutPosition === LAYOUT_POSITION.BOTTOM){
                if(isMinimized.layoutTwo){
                    panelWidths[0].maxSize = 20;
                    panelWidths[0].minSize = 20;
                    panelWidths[0].size = 20;
                } else{
                    panelWidths[1].size = height;
                }
            }
        }
        if(technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW){
            const businessLayoutPosition = this.state ? this.state.businessLayoutPosition : INITIAL_BUSINESS_LAYOUT_POSITION;
            if(businessLayoutPosition === LAYOUT_POSITION.TOP) {
                panelWidths = [
                    {minSize: LAYOUT_SETTINGS.MIN_WIDTH,},
                    {minSize: 1, size: 1, maxSize: 1},
                ];
            } else{
                panelWidths = [
                    {minSize: 1, size: 1, maxSize: 1},
                    {minSize: LAYOUT_SETTINGS.MIN_WIDTH,},
                ];
            }
        }
        if(businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW){
            const technicalLayoutPosition = this.state ? this.state.technicalLayoutPosition : INITIAL_TECHNICAL_LAYOUT_POSITION;
            if(technicalLayoutPosition === LAYOUT_POSITION.TOP) {
                panelWidths = [
                    {minSize: LAYOUT_SETTINGS.MIN_WIDTH,},
                    {minSize: 1, size: 1, maxSize: 1},
                ];
            } else{
                panelWidths = [
                    {minSize: 1, size: 1, maxSize: 1},
                    {minSize: LAYOUT_SETTINGS.MIN_WIDTH,},
                ];
            }
        }
        return panelWidths;
    }

    getPanelGroupParams(){
        const {verticalPanelWidths} = this.state;
        const {technicalLayoutLocation, businessLayoutLocation} = this.props;
        const borderColor = technicalLayoutLocation === PANEL_LOCATION.NEW_WINDOW || businessLayoutLocation === PANEL_LOCATION.NEW_WINDOW ? '#fff' : '#7f7f7f';
        return {
            direction: 'column',
            borderColor,
            borderWidth: 1,
            panelWidths: verticalPanelWidths,
            spacing: 2,
            onUpdate: ::this.onUpdatePanelGroupParams,
        };
    }

    replaceLayouts(){
        const {technicalLayoutPosition, businessLayoutPosition, verticalPanelWidths} = this.state;
        this.setState({
            businessLayoutPosition: technicalLayoutPosition,
            technicalLayoutPosition: businessLayoutPosition,
            verticalPanelWidths: [
                verticalPanelWidths[1],
                verticalPanelWidths[0],
            ],
        })
    }

    render(){
        const {entity} = this.props;
        const {businessLayoutPosition, technicalLayoutPosition, detailsPosition, isTechnicalLayoutMinimized, isBusinessLayoutMinimized, isDetailsMinimized} = this.state;
        const verticalPanelParams = ::this.getPanelGroupParams();
        return (
            <div className={`${styles.connection_editor} ${isTechnicalLayoutMinimized ? 'technical_layout_is_minimized' : ''}`}>
                <Details
                    moveDetailsRight={::this.moveDetailsRight}
                    moveDetailsLeft={::this.moveDetailsLeft}
                    position={detailsPosition}
                    minimize={::this.minimizeDetails}
                    maximize={::this.maximizeDetails}
                    isMinimized={isDetailsMinimized}
                />
                <PanelGroup {...verticalPanelParams}>
                    {businessLayoutPosition === LAYOUT_POSITION.TOP &&
                        <BusinessLayout
                            items={BUSINESS_DATA.processes}
                            arrows={BUSINESS_DATA.arrows}
                            isLayoutMinimized={isBusinessLayoutMinimized}
                            isTechnicalLayoutMinimized={isTechnicalLayoutMinimized}
                            minimizeLayout={::this.minimizeBusinessLayout}
                            maximizeLayout={::this.maximizeBusinessLayout}
                            maximizeTechnicalLayout={::this.maximizeTechnicalLayout}
                            replaceLayouts={::this.replaceLayouts}
                            detailsPosition={detailsPosition}
                            layoutPosition={businessLayoutPosition}
                        />
                    }
                    <TechnicalLayout
                        items={entity.toConnector.processes}
                        arrows={entity.toConnector.arrows}
                        isLayoutMinimized={isTechnicalLayoutMinimized}
                        isBusinessLayoutMinimized={isBusinessLayoutMinimized}
                        isBusinessLayoutEmpty={BUSINESS_DATA.processes.length === 0}
                        minimizeLayout={::this.minimizeTechnicalLayout}
                        maximizeLayout={::this.maximizeTechnicalLayout}
                        maximizeBusinessLayout={::this.maximizeBusinessLayout}
                        replaceLayouts={::this.replaceLayouts}
                        detailsPosition={detailsPosition}
                        isDetailsMinimized={isDetailsMinimized}
                        layoutPosition={technicalLayoutPosition}
                    />
                    {businessLayoutPosition === LAYOUT_POSITION.BOTTOM &&
                        <BusinessLayout
                            items={BUSINESS_DATA.processes}
                            arrows={BUSINESS_DATA.arrows}
                            isLayoutMinimized={isBusinessLayoutMinimized}
                            isTechnicalLayoutMinimized={isTechnicalLayoutMinimized}
                            minimizeLayout={::this.minimizeBusinessLayout}
                            maximizeLayout={::this.maximizeBusinessLayout}
                            maximizeTechnicalLayout={::this.maximizeTechnicalLayout}
                            replaceLayouts={::this.replaceLayouts}
                            detailsPosition={detailsPosition}
                            layoutPosition={businessLayoutPosition}
                        />
                    }
                </PanelGroup>
            </div>
        );
    }
}

export default FormConnectionSvg;