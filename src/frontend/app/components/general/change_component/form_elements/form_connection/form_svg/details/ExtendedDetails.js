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
import {Row, Col, Container} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {connect} from "react-redux";
import {DETAILS_POSITION} from "../FormConnectionSvg";
import PageNotFound from "@components/general/app/PageNotFound";
import {SEPARATE_WINDOW} from "@utils/constants/app";
import {mapItemsToClasses} from "../utils";
import Description from "@change_component/form_elements/form_connection/form_svg/details/description/Description";
import {BChannel} from "@utils/store";

function mapStateToProps(state){
    const {currentBusinessItem, currentTechnicalItem, connection, updateConnection} = mapItemsToClasses(state);
    return{
        currentBusinessItem,
        currentTechnicalItem,
        connection,
        updateConnection,
    };
}

@connect(mapStateToProps, {})
class ExtendedDetails extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            currentInfo: '',
        }
    }

    setCurrentInfo(currentInfo){
        this.setState({
            currentInfo,
        });
    }

    updateConnection(){
        const {connection} = this.props;
        BChannel.postMessage(connection.getObjectForConnectionOverview());
    }

    render(){
        /*
        * TODO: send updateEntity and connection throw the redux state
        */
        const {currentInfo} = this.state;
        const {currentBusinessItem, currentTechnicalItem, position, connection} = this.props;
        if(window.name !== SEPARATE_WINDOW.CONNECTION_OVERVIEW.DETAILS) {
            return <PageNotFound/>;
        }
        let details = currentTechnicalItem ? currentTechnicalItem : currentBusinessItem;
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
                <div className={styles.extended_details_data}>
                    <div className={styles.title}>
                        Details
                    </div>
                    {details ?
                        <Row className={styles.extended_details_row_description}>
                            <Col xs={6} sm={5} md={5} lg={3} className={styles.extended_details_col_description}>
                                <Description readOnly={connection.readOnly} details={details} isExtended={true} updateConnection={::this.updateConnection} connection={connection} currentInfo={currentInfo} setCurrentInfo={::this.setCurrentInfo}/>
                            </Col>
                            <Col className={styles.extended_details_information} xs={6} sm={7} md={7} lg={9} id={'extended_details_information'}/>
                        </Row>
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