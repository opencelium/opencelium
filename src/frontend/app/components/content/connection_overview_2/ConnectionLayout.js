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
import PanelGroup from 'react-panelgroup';
import BusinessLayout from "@components/content/connection_overview_2/BusinessLayout";
import ProgramLayout from "@components/content/connection_overview_2/ProgramLayout";
import Details from "@components/content/connection_overview_2/Details";

import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {componentAppear} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

/**
 * Layout for TemplateConverter
 */
class ConnectionLayout extends Component{

    constructor(props){
        super(props);

        this.state = {
            businessLayoutPosition: 'top',
            programLayoutPosition: 'bottom',
            detailsPosition: 'right',
        }
    }

    componentDidMount() {
        componentAppear('app_content');
    }

    moveDetails(){
        this.setState({
            detailsPosition: this.state.detailsPosition === 'right' ? 'left' : 'right',
        });
    }

    replaceLayouts(){
        this.setState({
            businessLayoutPosition: this.state.businessLayoutPosition === 'top' ? 'bottom' : 'top',
            programLayoutPosition: this.state.programLayoutPosition === 'top' ? 'bottom' : 'top',
        })
    }

    render(){
        const {businessLayoutPosition, programLayoutPosition, detailsPosition} = this.state;
        const rowPanelWidths = detailsPosition === 'right' ? [
            {minSize:100, size: 500, resize: "stretch"},
            {size: 250, minSize:250, maxSize: 400, resize: "dynamic"},
        ] : [
            {size: 250, minSize:250, maxSize: 400, resize: "dynamic"},
            {minSize:100, size: 500, resize: "stretch"},
        ];
        return (
            <div id={'app_content'} className={styles.connection_editor}>
                <PanelGroup direction="row" borderColor="grey" panelWidths={rowPanelWidths}>
                    {detailsPosition === 'left' && <Details moveDetails={::this.moveDetails} position={detailsPosition}/>}
                        {businessLayoutPosition === 'top'
                            ?
                            <PanelGroup direction="column" borderColor="grey" panelWidths={[
                                {minSize:100,},
                                {minSize:100,},
                            ]}>
                                <div id={'business_layout'} className={`${styles.business_layout}`}>
                                    <BusinessLayout/>
                                    <TooltipFontIcon onClick={::this.replaceLayouts} className={styles.replace_icon} tooltip={'Replace'} value={'import_export'} />
                                </div>
                                <div id={'program_layout'} className={`${styles.program_layout}`}>
                                    <ProgramLayout/>
                                </div>
                            </PanelGroup>
                            :
                            <PanelGroup direction="column" borderColor="grey" panelWidths={[
                                {minSize:100,},
                                {minSize:100,},
                            ]}>
                                <div id={'program_layout'} className={`${styles.program_layout}`}>
                                    <ProgramLayout/>
                                    <TooltipFontIcon onClick={::this.replaceLayouts} className={styles.replace_icon} tooltip={'Replace Layouts'} value={'import_export'} />
                                </div>
                                <div id={'business_layout'} className={`${styles.business_layout}`}>
                                    <BusinessLayout/>
                                </div>
                            </PanelGroup>
                        }
                    {detailsPosition === 'right' && <Details moveDetails={::this.moveDetails} position={detailsPosition}/>}
                </PanelGroup>
            </div>
        );
    }
}

export default ConnectionLayout;