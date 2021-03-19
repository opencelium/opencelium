import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {connect} from "react-redux";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        currentItem: connectionOverview.get('currentItem'),
        currentSubItem: connectionOverview.get('currentSubItem'),
    };
}

@connect(mapStateToProps, {})
class Details extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {currentItem, currentSubItem} = this.props;
        let details = currentSubItem ? currentSubItem : currentItem;
        return(
            <div className={styles.details}>
                <div className={styles.title}>
                    Details
                </div>
                {details ?
                    <div className={styles.label}>
                        Label: {details.label}
                        <br/>
                        Invoker: {details.invoker}
                    </div>
                    :
                    <div>
                        No item selected
                    </div>
                }
            </div>
        );
    }
}

export default Details;