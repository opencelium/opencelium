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
import styles from "@themes/default/content/connections/connection_overview_2";
import {setTechnicalLayoutLocation} from "@actions/connection_overview_2/set";

function mapStateToProps(state){
    const {connectionOverview, currentItem, items} = mapItemsToClasses(state);
    return{
        currentItem,
        items: connectionOverview.get('items').toJS(),
        arrows: connectionOverview.get('arrows').toJS(),
    };
}

@connect(mapStateToProps, {setCurrentItem, setCurrentSubItem, setTechnicalLayoutLocation})
class ExtendedTechnicalLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'technical_layout';
    }

    render(){
        return(
            <div id={this.layoutId} className={`${styles.technical_layout}`}>
                <Svg
                    {...this.props}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    isDraggable={false}
                    isScalable={false}
                />
            </div>
        );
    }
}

export default ExtendedTechnicalLayout;