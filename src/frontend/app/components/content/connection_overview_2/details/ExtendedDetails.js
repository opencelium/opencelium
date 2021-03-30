import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {connect} from "react-redux";
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";
import PageNotFound from "@components/general/app/PageNotFound";
import {SEPARATE_WINDOW} from "@utils/constants/app";
import {mapItemsToClasses} from "@components/content/connection_overview_2/utils";

function mapStateToProps(state){
    const {currentItem, currentSubItem} = mapItemsToClasses(state);
    return{
        currentItem,
        currentSubItem,
    };
}

@connect(mapStateToProps, {})
class ExtendedDetails extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {currentItem, currentSubItem, position} = this.props;
        if(window.name !== SEPARATE_WINDOW.CONNECTION_OVERVIEW.DETAILS) {
            return <PageNotFound/>;
        }
        let details = currentSubItem ? currentSubItem : currentItem;
        let detailsClassName = '';
        let detailsStyle = {};
        detailsClassName = styles.details_maximized;
        if(position === DETAILS_POSITION.RIGHT){
            detailsClassName += ` ${styles.details_right}`;
        }
        if(position === DETAILS_POSITION.LEFT){
            detailsClassName += ` ${styles.details_left}`;
        }
        return(
            <div className={detailsClassName} style={detailsStyle}>
                <div className={styles.details_data}>
                    <div className={styles.title}>
                        Details
                    </div>
                    {details ?
                        <div className={styles.label}>
                            {details.label && <React.Fragment><span>Label: {details.label}</span><br/></React.Fragment>}
                            {details.name && <React.Fragment><span>Name: {details.name}</span><br/></React.Fragment>}
                            {details.invoker && `Invoker: ${details.invoker}`}
                        </div>
                        :
                        <div>
                            {"Please, select an item"}
                        </div>
                    }
                </div>
            </div>
        );
    }
}

ExtendedDetails.defaultProps = {
    position: '',
}

export default ExtendedDetails;