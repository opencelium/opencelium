import React from 'react';
import styles from '@themes/default/layout/header.scss';
import {CNotification} from "@classes/components/general/CNotification";

class Callout extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {message, type, isBottom} = this.props;
        return(
            <div className={`${styles.callout} ${isBottom ? styles.bottom : ''}`}>
                {CNotification.getTypeIcon(type, 16)}
                <div className={styles.message}>{message}</div>
            </div>
        );
    }
}

Callout.defaultProps = {
    isBottom: true,
};

export default Callout;