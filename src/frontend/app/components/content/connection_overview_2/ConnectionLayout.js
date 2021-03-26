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
import Details from "@components/content/connection_overview_2/details/Details";

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

export const  LAYOUT_SETTINGS = {
    MIN_WIDTH: 200,
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
            technicalLayoutPosition: LAYOUT_POSITION.BOTTOM,
            detailsPosition: DETAILS_POSITION.RIGHT,
            verticalPanelWidths: ::this.getVerticalPanelWidthsForTechnical(),
            isDetailsMinimized: false,
            isBusinessLayoutMinimized: false,
            isTechnicalLayoutMinimized: false,
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
        if(!this.state.isBusinessLayoutMinimized) {
            this.setState({
                isTechnicalLayoutMinimized: true,
                verticalPanelWidths: ::this.getVerticalPanelWidthsForTechnical(true, this.state.isBusinessLayoutMinimized, this.state.technicalLayoutPosition),
            });
        } else{
            alert('Two panels cannot be minified');
        }
    }

    maximizeTechnicalLayout(){
        this.setState({
            isTechnicalLayoutMinimized: false,
            verticalPanelWidths: ::this.getVerticalPanelWidthsForTechnical(false, this.state.isBusinessLayoutMinimized, this.state.technicalLayoutPosition),
        });
    }

    minimizeBusinessLayout(){
        if(!this.state.isTechnicalLayoutMinimized) {
            this.setState({
                isBusinessLayoutMinimized: true,
                verticalPanelWidths: ::this.getVerticalPanelWidthsForBusiness(this.state.isTechnicalLayoutMinimized, true, this.state.businessLayoutPosition),
            });
        } else{
            alert('Two panels cannot be minified');
        }
    }

    maximizeBusinessLayout(){
        this.setState({
            isBusinessLayoutMinimized: false,
            verticalPanelWidths: ::this.getVerticalPanelWidthsForBusiness(this.state.isTechnicalLayoutMinimized, false, this.state.businessLayoutPosition),
        });
    }

    getVerticalPanelWidthsForTechnical(isTechnicalLayoutMinimized = false, isBusinessLayoutMinimized = false, technicalLayoutPosition = LAYOUT_POSITION.BOTTOM){
        let panelWidths = [
            {minSize: LAYOUT_SETTINGS.MIN_WIDTH,},
            {minSize: LAYOUT_SETTINGS.MIN_WIDTH,},
        ];
        if(isTechnicalLayoutMinimized){
            if(technicalLayoutPosition === LAYOUT_POSITION.TOP){
                panelWidths[0].maxSize = 20;
                panelWidths[0].minSize = 20;
                panelWidths[0].size = 20;
            }
            if(technicalLayoutPosition === LAYOUT_POSITION.BOTTOM){
                panelWidths[1].maxSize = 20;
                panelWidths[1].minSize = 20;
                panelWidths[1].size = 20;
            }
        } else{
            if(technicalLayoutPosition === LAYOUT_POSITION.TOP){
                if(isBusinessLayoutMinimized){
                    panelWidths[1].maxSize = 20;
                    panelWidths[1].minSize = 20;
                    panelWidths[1].size = 20;
                } else{
                    panelWidths[0].size = 300;
                }
            }
            if(technicalLayoutPosition === LAYOUT_POSITION.BOTTOM){
                if(isBusinessLayoutMinimized){
                    panelWidths[0].maxSize = 20;
                    panelWidths[0].minSize = 20;
                    panelWidths[0].size = 20;
                } else{
                    panelWidths[1].size = 300;
                }
            }
        }
        return panelWidths;
    }

    getVerticalPanelWidthsForBusiness(isTechnicalLayoutMinimized = false, isBusinessLayoutMinimized = false, businessLayoutPosition = LAYOUT_POSITION.BOTTOM){
        let panelWidths = [
            {minSize: LAYOUT_SETTINGS.MIN_WIDTH,},
            {minSize: LAYOUT_SETTINGS.MIN_WIDTH,},
        ];
        if(isBusinessLayoutMinimized){
            if(businessLayoutPosition === LAYOUT_POSITION.TOP){
                panelWidths[0].maxSize = 20;
                panelWidths[0].minSize = 20;
                panelWidths[0].size = 20;
            }
            if(businessLayoutPosition === LAYOUT_POSITION.BOTTOM){
                panelWidths[1].maxSize = 20;
                panelWidths[1].minSize = 20;
                panelWidths[1].size = 20;
            }
        } else{
            if(businessLayoutPosition === LAYOUT_POSITION.TOP){
                if(isTechnicalLayoutMinimized){
                    panelWidths[1].maxSize = 20;
                    panelWidths[1].minSize = 20;
                    panelWidths[1].size = 20;
                } else{
                    panelWidths[0].size = 300;
                }
            }
            if(businessLayoutPosition === LAYOUT_POSITION.BOTTOM){
                if(isTechnicalLayoutMinimized){
                    panelWidths[0].maxSize = 20;
                    panelWidths[0].minSize = 20;
                    panelWidths[0].size = 20;
                } else{
                    panelWidths[1].size = 300;
                }
            }
        }
        return panelWidths;
    }

    getVerticalPanelParams(){
        const {verticalPanelWidths} = this.state;
        return {
            direction: 'column',
            borderColor: '#7f7f7f',
            borderWidth: 1,
            panelWidths: verticalPanelWidths,
            spacing: 2,
        };
    }

    getHorizontalPanelParams(){
        const {detailsPosition, isDetailsMinimized, verticalPanelParams} = this.state;
        let params = {direction: 'row', borderColor: '#eee'};
        let rowPanelWidths = [];
        switch (detailsPosition) {
            case DETAILS_POSITION.RIGHT:
                rowPanelWidths = [
                    {minSize: 100, resize: "stretch"},
                    isDetailsMinimized ? {minSize: 20, maxSize: 20, resize: "dynamic"} : {minSize: DETAILS_SETTINGS.MIN_WIDTH, maxSize: DETAILS_SETTINGS.MAX_WIDTH, resize: "dynamic"},
                ];
                break;
            case DETAILS_POSITION.LEFT:
                rowPanelWidths = [
                    isDetailsMinimized ? {minSize: 20, maxSize: 20, resize: "dynamic"} : {minSize: DETAILS_SETTINGS.MIN_WIDTH, maxSize: DETAILS_SETTINGS.MAX_WIDTH, resize: "dynamic"},
                    {minSize: 100, resize: "stretch"},
                ];
                break;
        }
        params.panelWidths = rowPanelWidths;
        return params;
    }

    replaceLayoutsForTechnical(){
        this.setState({
            businessLayoutPosition: this.state.technicalLayoutPosition,
            technicalLayoutPosition: this.state.businessLayoutPosition,
            verticalPanelWidths: ::this.getVerticalPanelWidthsForTechnical(this.state.isTechnicalLayoutMinimized, this.state.isBusinessLayoutMinimized, this.state.businessLayoutPosition),
        })
    }

    replaceLayoutsForBusiness(){
        this.setState({
            businessLayoutPosition: this.state.technicalLayoutPosition,
            technicalLayoutPosition: this.state.businessLayoutPosition,
            verticalPanelWidths: ::this.getVerticalPanelWidthsForBusiness(this.state.isTechnicalLayoutMinimized, this.state.isBusinessLayoutMinimized, this.state.technicalLayoutPosition),
        })
    }

    renderTechnicalSettingsPanel(){
        const {detailsPosition, isTechnicalLayoutMinimized, isDetailsMinimized} = this.state;
        let settingsPanelClassName = '';
        let minMaxTooltip = 'Minimize';
        let minMaxValue = 'minimize';
        let minMaxClick = ::this.minimizeTechnicalLayout;
        let minMaxTooltipPosition = 'top';
        if(isTechnicalLayoutMinimized){
            minMaxTooltip = 'Maximize';
            minMaxValue = 'maximize';
            minMaxClick = ::this.maximizeTechnicalLayout;
        }
        let titleClassName = '';
        if(detailsPosition === DETAILS_POSITION.RIGHT){
            settingsPanelClassName = styles.layout_settings_panel_left;
            minMaxTooltipPosition = 'right';
            titleClassName = styles.technical_settings_panel_title_left;
        }
        if(detailsPosition === DETAILS_POSITION.LEFT){
            settingsPanelClassName = styles.layout_settings_panel_right;
            minMaxTooltipPosition = 'left';
            titleClassName = styles.technical_settings_panel_title_right;
        }
        if(isDetailsMinimized){
            titleClassName = styles.technical_settings_panel_title_center;
        }
        return(
            <div className={settingsPanelClassName}>
                <TooltipFontIcon className={styles.replace_icon} size={20} onClick={::this.replaceLayoutsForTechnical} tooltip={'Replace'} value={'import_export'} tooltipPosition={minMaxTooltipPosition}  />
                <div className={titleClassName}>Technical Layout</div>
                <TooltipFontIcon className={styles.min_max_icon} size={20} onClick={minMaxClick} tooltip={minMaxTooltip} value={minMaxValue} tooltipPosition={minMaxTooltipPosition}/>
            </div>
        );
    }

    renderBusinessSettingsPanel(){
        const {detailsPosition, isBusinessLayoutMinimized, isDetailsMinimized} = this.state;
        let settingsPanelClassName = '';
        let minMaxTooltip = 'Minimize';
        let minMaxValue = 'minimize';
        let minMaxClick = ::this.minimizeBusinessLayout;
        let minMaxTooltipPosition = 'top';
        if(isBusinessLayoutMinimized){
            minMaxTooltip = 'Maximize';
            minMaxValue = 'maximize';
            minMaxClick = ::this.maximizeBusinessLayout;
        }
        let titleClassName = '';
        if(detailsPosition === DETAILS_POSITION.RIGHT){
            settingsPanelClassName = styles.layout_settings_panel_left;
            minMaxTooltipPosition = 'right';
            titleClassName = styles.technical_settings_panel_title_left;
        }
        if(detailsPosition === DETAILS_POSITION.LEFT){
            settingsPanelClassName = styles.layout_settings_panel_right;
            minMaxTooltipPosition = 'left';
            titleClassName = styles.technical_settings_panel_title_right;
        }
        return(
            <div className={settingsPanelClassName}>
                <TooltipFontIcon className={styles.replace_icon} size={20} onClick={::this.replaceLayoutsForBusiness} tooltip={'Replace'} value={'import_export'} tooltipPosition={minMaxTooltipPosition}  />
                <div className={titleClassName}>Business Layout</div>
                <TooltipFontIcon className={styles.min_max_icon} size={20} onClick={minMaxClick} tooltip={minMaxTooltip} value={minMaxValue} tooltipPosition={minMaxTooltipPosition}/>
            </div>
        );
    }

    renderDetails(){
        const {detailsPosition, isDetailsMinimized} = this.state;
        return(
            <Details
                moveDetailsRight={::this.moveDetailsRight}
                moveDetailsLeft={::this.moveDetailsLeft}
                position={detailsPosition}
                minimize={::this.minimizeDetails}
                maximize={::this.maximizeDetails}
                isMinimized={isDetailsMinimized}
            />
        );
    }

    render(){
        const {businessLayoutPosition, detailsPosition, isTechnicalLayoutMinimized} = this.state;
        const horizontalPanelParams = ::this.getHorizontalPanelParams();
        const verticalPanelParams = ::this.getVerticalPanelParams();
        return (
            <div id={'app_content'} className={`${styles.connection_editor} ${isTechnicalLayoutMinimized ? 'technical_layout_is_minimized' : ''}`}>
                {::this.renderDetails()}
                {businessLayoutPosition === LAYOUT_POSITION.TOP
                    &&
                    <PanelGroup {...verticalPanelParams}>
                        <div id={'business_layout'} className={`${styles.business_layout}`}>
                            {this.renderBusinessSettingsPanel()}
                            <BusinessLayout detailsPosition={detailsPosition}/>
                        </div>
                        <div id={'technical_layout'} className={`${styles.technical_layout}`}>
                            {this.renderTechnicalSettingsPanel()}
                            <TechnicalLayout detailsPosition={detailsPosition}/>
                        </div>
                    </PanelGroup>
                }
                {businessLayoutPosition === LAYOUT_POSITION.BOTTOM
                    &&
                    <PanelGroup {...verticalPanelParams}>
                        <div id={'technical_layout'} className={`${styles.technical_layout}`}>
                            {this.renderTechnicalSettingsPanel()}
                            <TechnicalLayout detailsPosition={detailsPosition}/>
                        </div>
                        <div id={'business_layout'} className={`${styles.business_layout}`}>
                            {this.renderBusinessSettingsPanel()}
                            <BusinessLayout detailsPosition={detailsPosition}/>
                        </div>
                    </PanelGroup>
                }
            </div>
        );
    }
}

export default ConnectionLayout;