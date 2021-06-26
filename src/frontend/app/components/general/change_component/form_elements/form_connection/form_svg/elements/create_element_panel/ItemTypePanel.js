import React from 'react';
import {Line} from "@change_component/form_elements/form_connection/form_svg/elements/create_element_panel/Lines";
import styles from "@themes/default/content/connections/connection_overview_2";
import CCreateElementPanel, {CREATE_OPERATOR, CREATE_PROCESS} from "@classes/components/content/connection_overview_2/CCreateElementPanel";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";

class ItemTypePanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {selectedItem, type, changeType, noOperatorType, hasBeforeLine, createElementPanelConnectorType, isOnTheTopLayout} = this.props;
        const {isInBusinessLayout,isInTechnicalFromConnectorLayout, isInTechnicalToConnectorLayout} = CCreateElementPanel.getLocationData(createElementPanelConnectorType);
        let {x, y} = CCreateElementPanel.getCoordinates(this.props);
        let ItemClass = selectedItem;
        if(selectedItem === null){
            if(isInBusinessLayout){
                ItemClass = CBusinessProcess;
            }
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