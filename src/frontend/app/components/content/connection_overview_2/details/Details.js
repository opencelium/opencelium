/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {connect} from "react-redux";
import SettingsPanel from "@components/content/connection_overview_2/details/SettingsPanel";
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";
import {PANEL_LOCATION, SEPARATE_WINDOW} from "@utils/constants/app";
import {mapItemsToClasses} from "@components/content/connection_overview_2/utils";
import {connectionOverviewDetailsUrl} from "@utils/constants/url";
import {setDetailsLocation} from "@actions/connection_overview_2/set";
import {NewWindowFeature} from "@decorators/NewWindowFeature";


function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentItem, currentSubItem} = mapItemsToClasses(state);
    return{
        connectionOverviewState: connectionOverview,
        currentItem,
        currentSubItem,
        detailsLocation: connectionOverview.get('detailsLocation'),
    };
}

function isLocationSameWindow(props){
    return props.detailsLocation === PANEL_LOCATION.SAME_WINDOW;
}

function setLocation(props, data){
    props.setDetailsLocation(data);
}

function moveTo(props, newWindow){
    if(props.position === DETAILS_POSITION.LEFT){
        newWindow.moveTo(0, 0);
    }
    if(props.position === DETAILS_POSITION.RIGHT){
        newWindow.moveTo(20000, 0);
    }
}

@connect(mapStateToProps, {setDetailsLocation})
@NewWindowFeature({url: connectionOverviewDetailsUrl, windowName: SEPARATE_WINDOW.CONNECTION_OVERVIEW.DETAILS, setLocation, isLocationSameWindow, moveTo})
class Details extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {currentItem, currentSubItem, isMinimized, position, detailsLocation, openInNewWindow} = this.props;
        if(detailsLocation === PANEL_LOCATION.NEW_WINDOW){
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
                <SettingsPanel {...this.props} openInNewWindow={openInNewWindow}/>
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