/*
 * Copyright (C) <2020>  <becon GmbH>
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
import BusinessLayout from "@components/content/connection_overview_2/layouts/BusinessLayout";
import TechnicalLayout from "@components/content/connection_overview_2/layouts/TechnicalLayout";
import Details from "@components/content/connection_overview_2/Details";

import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {componentAppear} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {setItems, setArrows} from "@actions/connection_overview_2/set";
import {ARROWS, ITEMS} from "@components/content/connection_overview_2/data";
import {CBusinessOperator} from "@classes/components/content/connection_overview_2/operator/CBusinessOperator";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";


export const HAS_LAYOUTS_SCALING = false;

export const LAYOUT_POSITION = {
    TOP: 'top',
    BOTTOM: 'bottom',
};

export const DETAILS_POSITION = {
    RIGHT: 'right',
    LEFT: 'left',
};

export const DETAILS_SETTINGS = {
    MIN_WIDTH: 250,
    MAX_WIDTH: 400,
};

/**
 * Layout for TemplateConverter
 */
@connect(null, {setArrows, setItems})
class ConnectionLayout extends Component{

    constructor(props){
        super(props);

        this.state = {
            businessLayoutPosition: LAYOUT_POSITION.TOP,
            programLayoutPosition: LAYOUT_POSITION.BOTTOM,
            detailsPosition: DETAILS_POSITION.RIGHT,
            horizPanelWidths: [
                {minSize:100,},
                {minSize:100,},
            ],
            verticalPanelWidths: [],
            businessLayoutWidth: 0,
            businessLayoutHeight: 0,
            technicalLayoutWidth: 0,
            technicalLayoutHeight: 0,
        }
    }

    componentDidMount() {
        componentAppear('app_content');
        const {setItems, setArrows} = this.props;
        setArrows(ARROWS);
        setItems(::this.getItems())
    }

    getItems(){
        return ITEMS.map((item, key) => {
            if(item.hasOwnProperty('type')){
                return CBusinessOperator.createBusinessOperator(item);
            } else{
                return CBusinessProcess.createBusinessProcess(item);
            }
        });
    }

    resizeStartHorizPanel(panels){
        let {businessLayoutPosition, businessLayoutHeight, technicalLayoutHeight} = this.state;
        if(businessLayoutPosition === LAYOUT_POSITION.TOP){
            businessLayoutHeight = panels[0].size;
            technicalLayoutHeight = panels[1].size;
        }
        if(businessLayoutPosition === LAYOUT_POSITION.BOTTOM){
            technicalLayoutHeight = panels[0].size;
            businessLayoutHeight = panels[1].size;
        }
        this.setState({
            businessLayoutHeight,
            technicalLayoutHeight,
        })
    }

    resizeEndHorizPanel(panels){
        let {businessLayoutPosition, businessLayoutHeight, technicalLayoutHeight} = this.state;
        if(businessLayoutPosition === LAYOUT_POSITION.TOP){
            businessLayoutHeight = panels[0].size;
            technicalLayoutHeight = panels[1].size;
        }
        if(businessLayoutPosition === LAYOUT_POSITION.BOTTOM){
            technicalLayoutHeight = panels[0].size;
            businessLayoutHeight = panels[1].size;
        }
        this.setState({
            horizPanelWidths: panels,
            businessLayoutHeight,
            technicalLayoutHeight,
        })
    }

    resizeStartVerticalPanel(panels){
        let {detailsPosition, businessLayoutWidth, technicalLayoutWidth} = this.state;
        if(detailsPosition === DETAILS_POSITION.RIGHT){
            businessLayoutWidth = panels[0].size;
            technicalLayoutWidth = panels[0].size;
        }
        if(detailsPosition === DETAILS_POSITION.LEFT){
            technicalLayoutWidth = panels[1].size;
            businessLayoutWidth = panels[1].size;
        }
        this.setState({
            businessLayoutWidth,
            technicalLayoutWidth,
        })
    }

    resizeEndVerticalPanel(panels){
        let {detailsPosition, businessLayoutWidth, technicalLayoutWidth} = this.state;
        if(detailsPosition === DETAILS_POSITION.RIGHT){
            businessLayoutWidth = panels[0].size;
            technicalLayoutWidth = panels[0].size;
        }
        if(detailsPosition === DETAILS_POSITION.LEFT){
            technicalLayoutWidth = panels[1].size;
            businessLayoutWidth = panels[1].size;
        }
        this.setState({
            horizPanelWidths: panels,
            businessLayoutWidth,
            technicalLayoutWidth,
        })
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

    setHorizontalPanelParams(){
        const {detailsPosition, verticalPanelWidths} = this.state;
        let params = {direction: 'row', borderColor: 'grey'};
        let rowPanelWidths = verticalPanelWidths;
        if(rowPanelWidths.length === 0) {
            switch (detailsPosition) {
                case DETAILS_POSITION.RIGHT:
                    rowPanelWidths = [
                        {minSize: 100, resize: "stretch"},
                        {minSize: DETAILS_SETTINGS.MIN_WIDTH, maxSize: DETAILS_SETTINGS.MAX_WIDTH, resize: "dynamic"},
                    ];
                    break;
                case DETAILS_POSITION.LEFT:
                    rowPanelWidths = [
                        {minSize: DETAILS_SETTINGS.MIN_WIDTH, maxSize: DETAILS_SETTINGS.MAX_WIDTH, resize: "dynamic"},
                        {minSize: 100, resize: "stretch"},
                    ];
                    break;
            }
        }
        params.panelWidths = rowPanelWidths;
        params.onResizeStart = ::this.resizeStartVerticalPanel;
        params.onResizeEnd= ::this.resizeEndVerticalPanel;
        return params;
    }

    replaceLayouts(){
        this.setState({
            businessLayoutPosition: this.state.programLayoutPosition,
            programLayoutPosition: this.state.businessLayoutPosition,
        })
    }

    renderReplaceIcon(){
        return(
            <div className={styles.replace_icon}>
                <TooltipFontIcon onClick={::this.replaceLayouts} tooltip={'Replace'} value={'import_export'}/>
            </div>
        );
    }

    render(){
        const {businessLayoutPosition, detailsPosition, horizPanelWidths, businessLayoutWidth, businessLayoutHeight, technicalLayoutWidth, technicalLayoutHeight} = this.state;
        const horizontalPanelParams = ::this.setHorizontalPanelParams();
        return (
            <div id={'app_content'} className={styles.connection_editor}>
                <PanelGroup {...horizontalPanelParams}>
                    {detailsPosition === DETAILS_POSITION.LEFT && <Details moveDetails={::this.moveDetailsRight} position={detailsPosition}/>}
                        {businessLayoutPosition === LAYOUT_POSITION.TOP
                            &&
                            <PanelGroup onResizeStart={::this.resizeStartHorizPanel} onResizeEnd={::this.resizeEndHorizPanel} direction="column" borderColor="grey" panelWidths={horizPanelWidths}>
                                <div id={'business_layout'} className={`${styles.business_layout}`}>
                                    <BusinessLayout svgWidth={businessLayoutWidth} svgHeight={businessLayoutHeight}/>
                                    {this.renderReplaceIcon()}
                                </div>
                                <div id={'technical_layout'} className={`${styles.technical_layout}`}>
                                    <TechnicalLayout svgWidth={technicalLayoutWidth} svgHeight={technicalLayoutHeight}/>
                                </div>
                            </PanelGroup>
                        }
                        {businessLayoutPosition === LAYOUT_POSITION.BOTTOM
                            &&
                            <PanelGroup onResizeStart={::this.resizeStartHorizPanel} onResizeEnd={::this.resizeEndHorizPanel} direction="column" borderColor="grey" panelWidths={horizPanelWidths}>
                                <div id={'technical_layout'} className={`${styles.technical_layout}`}>
                                    <TechnicalLayout svgWidth={technicalLayoutWidth} svgHeight={technicalLayoutHeight}/>
                                    {this.renderReplaceIcon()}
                                </div>
                                <div id={'business_layout'} className={`${styles.business_layout}`}>
                                    <BusinessLayout svgWidth={businessLayoutWidth} svgHeight={businessLayoutHeight}/>
                                </div>
                            </PanelGroup>
                        }
                    {detailsPosition === DETAILS_POSITION.RIGHT && <Details moveDetails={::this.moveDetailsLeft} position={detailsPosition}/>}
                </PanelGroup>
            </div>
        );
    }
}

export default ConnectionLayout;