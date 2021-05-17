import React from 'react';
import {Col, Row} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import {isString} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

class Endpoint extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        return(
            <React.Fragment>
                <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Endpoint`}</Col>
                <Col xs={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`URL`}</span>} tooltip={'URL'}/></Col>
            </React.Fragment>
        );
    }
}

export default Endpoint;