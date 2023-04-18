/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2.scss";
import {connect} from "react-redux";
import SettingsPanel from "./SettingsPanel";
import {mapItemsToClasses} from "../utils";
import Description from "@change_component/form_elements/form_connection/form_svg/details/description/Description";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {TextSize} from "@app_component/base/text/interfaces";
import {toggleDetails} from "@root/redux_toolkit/slices/ConnectionSlice";


function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const {currentTechnicalItem, connection} = mapItemsToClasses(state);
    return{
        connectionOverviewState: connectionOverview,
        currentTechnicalItem,
        detailsLocation: connectionOverview.detailsLocation,
        isDetailsOpened: connectionOverview.isDetailsOpened,
        connection,
        updatingConnection: connectionOverview.updatingConnection,
        checkingConnectionTitle: connectionOverview.checkingConnectionTitle,
    };
}


@connect(mapStateToProps, {toggleDetails})
class Details extends React.Component{
    constructor(props) {
        super(props);
    }

    update(){
        const {data, connection} = this.props;
        data.justUpdate(connection);
    }

    render(){
        const {
            readOnly, currentTechnicalItem, updateConnection,
            connection, isDetailsOpened, toggleDetails,
        } = this.props;
        if(connection === null){
            return null;
        }
        let details = currentTechnicalItem ? currentTechnicalItem : null;
        let detailsStyle = {};
        if(!isDetailsOpened){
            return (
                <TooltipButton
                    size={TextSize.Size_20}
                    position={'bottom'}
                    className={styles.show_icon}
                    icon={'chevron_left'}
                    tooltip={'Show Details'}
                    target={`show_connection_button`}
                    hasBackground={false}
                    handleClick={toggleDetails}
                />
            );
        }
        return(
            <div className={`${styles.details_maximized} ${styles.details_right}`} style={detailsStyle}>
                <SettingsPanel {...this.props}/>
                <div className={styles.details_data}>
                    <div className={styles.title}>
                        Details
                    </div>
                    {details ?
                        <div className={styles.label}>
                            <Description readOnly={readOnly} details={details} updateConnection={updateConnection}/>
                        </div>
                        :
                        <div>
                            {"There is no selected item"}
                        </div>
                    }
                </div>
            </div>
        );
    }
}

Details.defaultProps = {
}

export default Details;