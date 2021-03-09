import React from 'react';
import Process from "@components/content/connection_overview_2/elements/Process";
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import IfOperator from "@components/content/connection_overview_2/elements/IfOperator";

class BusinessLayout extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        return(
            <svg className={styles.business_layout}>
                <Process x={20} y={20} label={'Get Clients'}/>
                <Process x={220} y={20} label={'Save Tickets'}/>
                <IfOperator x={220} y={100}/>
            </svg>
        );
    }
}

export default BusinessLayout;