import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2.scss";

class Details extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        return(
            <div className={styles.details}>
                Details
            </div>
        );
    }
}

export default Details;