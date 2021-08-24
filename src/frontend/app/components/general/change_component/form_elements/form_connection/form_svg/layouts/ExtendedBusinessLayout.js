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
import {setCurrentBusinessItem} from "@actions/connection_overview_2/set";
import {mapItemsToClasses} from "../utils";
import Svg from "../layouts/Svg";
import styles from "@themes/default/content/connections/connection_overview_2";
import {setBusinessLayoutLocation} from "@actions/connection_overview_2/set";
import CreateElementPanel from "../elements/create_element_panel/CreateElementPanel";
import {HAS_LAYOUTS_SCALING} from "@change_component/form_elements/form_connection/form_svg/FormConnectionSvg";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {connection, currentBusinessItem, updateConnection} = mapItemsToClasses(state);
    return{
        currentBusinessItem,
        connection,
        updateConnection,
        items: connection.businessLayout.getItems(),
        arrows: connection.businessLayout.getArrows(),
        technicalLayoutLocation: connectionOverview.get('technicalLayoutLocation'),
        businessLayoutLocation: connectionOverview.get('businessLayoutLocation'),
    };
}

@connect(mapStateToProps, {setCurrentBusinessItem, setBusinessLayoutLocation})
class ExtendedBusinessLayout extends React.Component{

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

    setCurrentItem(currentItem){
        const {setCurrentBusinessItem, connection, updateConnection} = this.props;
        setCurrentBusinessItem(currentItem);
        if(connection) {
            connection.businessLayout.setCurrentSvgItem(currentItem);
            updateConnection(connection);
        }
    }

    render(){
        const {items} = this.props;
        const {createElementPanelPosition} = this.state;
        return(
            <div id={this.layoutId} className={`${styles.business_layout}`}>
                <Svg
                    {...this.props}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isItemDraggable={true}
                    isDraggable={items.length > 0}
                    isScalable={items.length > 0 && HAS_LAYOUTS_SCALING}
                    setCreateElementPanelPosition={::this.setCreateElementPanelPosition}
                    setCurrentItem={::this.setCurrentItem}
                />
                <CreateElementPanel x={createElementPanelPosition.x} y={createElementPanelPosition.y}/>
            </div>
        );
    }
}

export default ExtendedBusinessLayout;