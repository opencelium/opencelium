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
import {Line} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import CCreateElementPanel, {CREATE_OPERATOR, CREATE_PROCESS} from "@entity/connection/components/classes/components/content/connection_overview_2/CCreateElementPanel";
import {CTechnicalProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";

class ItemTypePanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {selectedItem, type, changeType, noOperatorType, hasBeforeLine, createElementPanelConnectorType, isOnTheTopLayout} = this.props;
        const {isInTechnicalFromConnectorLayout, isInTechnicalToConnectorLayout} = CCreateElementPanel.getLocationData(createElementPanelConnectorType);
        let {x, y} = CCreateElementPanel.getCoordinates(this.props);
        let ItemClass = selectedItem;
        if(selectedItem === null){
            if(isInTechnicalFromConnectorLayout || isInTechnicalToConnectorLayout){
                ItemClass = CTechnicalProcess;
            }
        }
        let {itemTypeLine, panelItemTypeStyles} = ItemClass.getCreateElementPanelStyles(x, y, {noOperatorType, isOnTheTopLayout});
        return(
            <React.Fragment>
                {hasBeforeLine && <Line style={itemTypeLine}/>}
                <div className={styles.create_element_panel} style={panelItemTypeStyles}>
                    <div className={`${noOperatorType ? styles.item_one : styles.item_first} ${type === CREATE_PROCESS ? styles.selected_item : ''}`}
                         onClick={() => changeType(CREATE_PROCESS)}>
                        {'Process'}
                    </div>
                    {!noOperatorType &&
                    <div className={`${styles.item_second} ${type === CREATE_OPERATOR ? styles.selected_item : ''}`}
                         onClick={() => changeType(CREATE_OPERATOR)}>
                        {'Operator'}
                    </div>
                    }
                </div>
            </React.Fragment>
        );
    }
}

export default ItemTypePanel;