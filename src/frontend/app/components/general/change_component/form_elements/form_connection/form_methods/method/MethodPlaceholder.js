import React, {Component} from 'react';
import styles from '@themes/default/general/form_methods.scss';

class MethodPlaceholder extends Component{
    constructor(props) {
        super(props);
    }

    render(){
        return(
            <div className={styles.method_placeholder}/>
        )
    }
}

export default MethodPlaceholder;