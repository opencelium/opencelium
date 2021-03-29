import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {connect} from "react-redux";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import SettingsPanel from "@components/content/connection_overview_2/details/SettingsPanel";
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";


export const DETAILS_LOCATION = {
    NEW_WINDOW: 'new_window',
    SAME_WINDOW: 'same_window',
};

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        currentItem: connectionOverview.get('currentItem'),
        currentSubItem: connectionOverview.get('currentSubItem'),
        detailsLocation: connectionOverview.get('detailsLocation'),
    };
}

@connect(mapStateToProps, {})
class Details extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {currentItem, currentSubItem, isMinimized, position, detailsLocation} = this.props;
        if(detailsLocation === DETAILS_LOCATION.NEW_WINDOW){
            return null;
        }
        let details = currentSubItem ? currentSubItem : currentItem;
        let detailsClassName = '';
        let detailsStyle = {};
        if(isMinimized){
            detailsClassName = styles.details_minimized;
        } else{
            detailsClassName = styles.details_maximized;
        }
        if(position === DETAILS_POSITION.RIGHT){
            detailsClassName += ` ${styles.details_right}`;
        }
        if(position === DETAILS_POSITION.LEFT){
            detailsClassName += ` ${styles.details_left}`;
        }
        return(
            <div className={detailsClassName} style={detailsStyle}>
                <SettingsPanel {...this.props}/>
                {!isMinimized &&
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
                                No item selected
                            </div>
                        }
                    </div>
                }
            </div>
        );
    }
}

Details.defaultProps = {
    moveDetailsRight: () => {},
    moveDetailsLeft: () => {},
    position: '',
    minimize: () => {},
    maximize: () => {},
    isMinimized: false,

}

export default Details;