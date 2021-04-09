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
import {setCurrentItem, setItems} from "@actions/connection_overview_2/set";
import {mapItemsToClasses} from "@components/content/connection_overview_2/utils";
import Svg from "@components/content/connection_overview_2/layouts/Svg";
import styles from "@themes/default/content/connections/connection_overview_2";
import {setBusinessLayoutLocation} from "@actions/connection_overview_2/set";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentItem, items} = mapItemsToClasses(state);
    return{
        currentItem,
        items,
        arrows: connectionOverview.get('arrows').toJS(),
        technicalLayoutLocation: connectionOverview.get('technicalLayoutLocation'),
        businessLayoutLocation: connectionOverview.get('businessLayoutLocation'),
    };
}

@connect(mapStateToProps, {setCurrentItem, setItems, setBusinessLayoutLocation})
class ExtendedBusinessLayout extends React.Component{

    constructor(props) {
        super(props);
        this.layoutId = 'business_layout';
    }

    render(){
        return(
            <div id={this.layoutId} className={`${styles.business_layout}`}>
                <Svg
                    {...this.props}
                    layoutId={this.layoutId}
                    svgId={`${this.layoutId}_svg`}
                    dragAndDropStep={5}
                    isDraggable={true}
                    isScalable={false}
                />
            </div>
        );
    }
}

export default ExtendedBusinessLayout;