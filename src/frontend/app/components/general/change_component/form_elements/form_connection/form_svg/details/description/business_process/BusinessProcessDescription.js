import React from 'react';
import {connect} from 'react-redux';
import {Row} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import Label from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Label";
import {setCurrentBusinessItem} from "@actions/connection_overview_2/set";

@connect(null, {setCurrentBusinessItem})
class BusinessProcessDescription extends React.Component{
    constructor(props) {
        super(props);
    }

    changeLabel(label){
        const {connection, details, updateConnection, setCurrentBusinessItem} = this.props;
        connection.businessLayout.changeItemName(details, label);
        const currentBusinessItem = connection.businessLayout.getItemByIndex(details.index);
        updateConnection(connection);
        if(currentBusinessItem) setCurrentBusinessItem(currentBusinessItem);
    }

    render(){
        const label = this.props.details.name;
        return(
            <Row className={styles.row}>
                <Label {...this.props} label={label} changeLabel={::this.changeLabel}/>
            </Row>
        );
    }
}

export default BusinessProcessDescription;