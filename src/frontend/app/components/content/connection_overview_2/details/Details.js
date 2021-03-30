import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {connect} from "react-redux";
import SettingsPanel from "@components/content/connection_overview_2/details/SettingsPanel";
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";
import {DETAILS_LOCATION, SEPARATE_WINDOW} from "@utils/constants/app";
import {mapItemsToClasses} from "@components/content/connection_overview_2/utils";
import {connectionOverviewDetailsUrl} from "@utils/constants/url";
import {setDetailsLocation} from "@actions/connection_overview_2/set";


function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentItem, currentSubItem} = mapItemsToClasses(state);
    return{
        currentItem,
        currentSubItem,
        detailsLocation: connectionOverview.get('detailsLocation'),
    };
}

@connect(mapStateToProps, {setDetailsLocation})
class Details extends React.Component{
    constructor(props) {
        super(props);
        this.isOpenedConnectionOverviewDetailsWindow = false;
        this.connectionOverviewDetailsWindow = null;
        this.checkIfWindowClosed = () => {};
    }

    openInNewWindow(){
        const {position, setDetailsLocation} = this.props;
        const that = this;
        this.connectionOverviewDetailsWindow = window.open(connectionOverviewDetailsUrl, SEPARATE_WINDOW.CONNECTION_OVERVIEW.DETAILS, 'menubar:0,status:0,toolbar:0');
        this.connectionOverviewDetailsWindow.onload = () => {setTimeout(() => {that.isOpenedConnectionOverviewDetailsWindow = true;}, 200); setDetailsLocation({location: DETAILS_LOCATION.NEW_WINDOW})};
        if(position === DETAILS_POSITION.LEFT){
            this.connectionOverviewDetailsWindow.moveTo(0, 0);
        }
        if(position === DETAILS_POSITION.RIGHT){
            this.connectionOverviewDetailsWindow.moveTo(20000, 0);
        }
        this.checkIfWindowClosed = setInterval(() => {
            if(that.connectionOverviewDetailsWindow){
                if(that.connectionOverviewDetailsWindow.closed) {
                    clearInterval(that.checkIfWindowClosed);
                    setDetailsLocation({location: DETAILS_LOCATION.SAME_WINDOW});
                    that.connectionOverviewDetailsWindow = null;
                    that.isOpenedConnectionOverviewDetailsWindow = false;
                }
                if(that.isOpenedConnectionOverviewDetailsWindow && that.connectionOverviewDetailsWindow && that.props.detailsLocation === DETAILS_LOCATION.SAME_WINDOW){
                    clearInterval(that.checkIfWindowClosed);
                    that.connectionOverviewDetailsWindow.close();
                    that.connectionOverviewDetailsWindow = null;
                    that.isOpenedConnectionOverviewDetailsWindow = false;
                }
            }
        }, 100);
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
                <SettingsPanel {...this.props} openInNewWindow={::this.openInNewWindow}/>
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