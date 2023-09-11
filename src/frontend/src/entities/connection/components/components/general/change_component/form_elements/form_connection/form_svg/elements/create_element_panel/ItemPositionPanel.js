/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {INSIDE_ITEM, OUTSIDE_ITEM} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import CCreateElementPanel from "@entity/connection/components/classes/components/content/connection_overview_2/CCreateElementPanel";

class ItemPositionPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        if(this.props.isModal){
            return false;
        }
        let {itemPosition, onChangeItemPosition} = this.props;
        let {x, y} = CCreateElementPanel.getCoordinates(this.props);
        const panelItemPositionStyles = {top: `${y - 5}px`, left: `${x + 12}px`};
        if(!itemPosition){
            itemPosition = OUTSIDE_ITEM;
        }
        return(
            <React.Fragment>
                <div className={styles.create_element_panel} style={panelItemPositionStyles}>
                    <div className={`${styles.item_first} ${itemPosition === OUTSIDE_ITEM ? styles.selected_item : ''}`}
                         onClick={() => onChangeItemPosition(OUTSIDE_ITEM)}>Out
                    </div>
                    <div className={`${styles.item_second} ${itemPosition === INSIDE_ITEM ? styles.selected_item : ''}`}
                         onClick={() => onChangeItemPosition(INSIDE_ITEM)}>In
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default ItemPositionPanel;