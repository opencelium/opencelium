/*
 * Copyright (C) <2022>  <becon GmbH>
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
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2.scss";
import {connect} from "react-redux";
import {DETAILS_POSITION} from "../FormConnectionSvg";
import {SEPARATE_WINDOW} from "@entity/connection/components/utils/constants/app";
import {mapItemsToClasses} from "../utils";
import Description from "@change_component/form_elements/form_connection/form_svg/details/description/Description";
import {withTranslation} from "react-i18next";
import {
    setConnectionData,
    setCurrentBusinessItem,
    setCurrentTechnicalItem,
    setTechnicalLayoutLocation
} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {PageNotFound} from "@app_component/default_pages/page_not_found/PageNotFound";

function mapStateToProps(state){
    const {currentBusinessItem, currentTechnicalItem, connection} = mapItemsToClasses(state);
    return{
        currentBusinessItem,
        currentTechnicalItem,
        connection,
    };
}

@connect(mapStateToProps, {setCurrentBusinessItem, setCurrentTechnicalItem, setTechnicalLayoutLocation, setConnectionData})
@withTranslation('basic_components')
class ExtendedDetails extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            currentInfo: '',
        }
    }
    componentDidMount() {
        this.props.setConnectionData({connection: this.props.connection.getObjectForConnectionOverview()});
    }

    setCurrentInfo(currentInfo){
        this.setState({
            currentInfo,
        });
    }

    updateConnection(connection){
        this.props.setConnectionData({connection: connection.getObjectForConnectionOverview()});
    }

    render(){
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
                                <Description readOnly={connection.readOnly} details={details} isExtended={true} updateConnection={(a) => this.updateConnection(a)} connection={connection} currentInfo={currentInfo} setCurrentInfo={(a) => this.setCurrentInfo(a)}/>
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