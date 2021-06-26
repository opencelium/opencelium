import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import {INSIDE_ITEM, OUTSIDE_ITEM} from "@classes/components/content/connection/CConnectorItem";
import CCreateElementPanel from "@classes/components/content/connection_overview_2/CCreateElementPanel";

class ItemPositionPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {itemPosition, onChangeItemPosition} = this.props;
        let {x, y} = CCreateElementPanel.getCoordinates(this.props);
        const panelItemPositionStyles = {top: `${y - 5}px`, left: `${x + 12}px`};
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