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
import {DETAILS_POSITION} from "../FormConnectionSvg";
import PageNotFound from "@components/general/app/PageNotFound";
import {SEPARATE_WINDOW} from "@utils/constants/app";
import {mapItemsToClasses} from "../utils";
import Description from "@change_component/form_elements/form_connection/form_svg/details/description/Description";

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
        /*
        * TODO: send updateEntity and connection throw the redux state
        */
        const {currentItem, currentSubItem, position, updateEntity} = this.props;
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
                            <Description details={details} isExtended={true} updateEntity={updateEntity}/>
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