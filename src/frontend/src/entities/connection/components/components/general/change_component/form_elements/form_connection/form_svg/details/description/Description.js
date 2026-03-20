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
import PropTypes from 'prop-types';
import { Row, Col } from "react-grid-system";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import COperator from "@entity/connection/components/classes/components/content/connection_overview_2/operator/COperator";
import Condition from "@change_component/form_elements/form_connection/form_svg/details/description/operator/Condition";
import OperatorType from "@change_component/form_elements/form_connection/form_svg/details/description/operator/OperatorType";
import TechnicalProcessDescription
    from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/TechnicalProcessDescription";
import { CTechnicalProcess } from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";
import { withTheme } from "styled-components";
import { mapItemsToClasses } from "@change_component/form_elements/form_connection/form_svg/utils";
import { connect } from "react-redux";
import DataAggregator
    from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/DataAggregator";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';
import DefaultText from "@app_component/base/text/DefaultText";

function mapStateToProps(state, props){
    const { connection } = mapItemsToClasses(state, props.isModal);
    return {
        connection,
    };
}

@GetModalProp()
@connect(mapStateToProps, {}, null, { forwardRef: true })
class Description extends React.Component {
    constructor(props) {
        super(props);
        this.conditionRef = React.createRef();
        this.technicalProcessDescriptionRef = React.createRef();
    }

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.details !== this.props.details ||
            nextProps.connection !== this.props.connection ||
            nextProps.updateConnection !== this.props.updateConnection ||
            nextProps.isExtended !== this.props.isExtended ||
            nextProps.currentInfo !== this.props.currentInfo ||
            nextProps.setCurrentInfo !== this.props.setCurrentInfo ||
            nextProps.readOnly !== this.props.readOnly ||
            nextProps.theme !== this.props.theme
        );
    }

    getOperatorContext() {
        const { details, connection } = this.props;
        const operatorItem = details?.entity || null;
        const connector = details ? connection.getConnectorByType(details.connectorType) : null;
        const connectorOperator = connector && operatorItem
            ? connector.getOperatorByIndex(operatorItem.index)
            : null;

        return {
            operatorItem,
            connector,
            errorMessages: connectorOperator?.error?.messages || [],
        };
    }

    renderForOperator() {
        const {
            details,
            connection,
            updateConnection,
            isExtended,
            currentInfo,
            setCurrentInfo,
            readOnly,
        } = this.props;

        const { operatorItem } = this.getOperatorContext();

        return (
            <Row className={styles.row}>
                <OperatorType
                    readOnly={readOnly}
                    details={details}
                    connection={connection}
                    updateConnection={updateConnection}
                />

                {operatorItem?.iterator && (
                    <React.Fragment>
                        <Col xs={4} className={styles.col}>
                            <DefaultText value={`Iterator`} />
                        </Col>
                        <Col xs={8} className={`${styles.col} ${styles.value}`}>
                            <DefaultText value={operatorItem.iterator} />
                        </Col>
                    </React.Fragment>
                )}

                <Condition
                    ref={this.conditionRef}
                    readOnly={readOnly}
                    nameOfCurrentInfo={'operator_condition'}
                    isCurrentInfo={currentInfo === 'operator_condition'}
                    setCurrentInfo={setCurrentInfo}
                    isExtended={isExtended}
                    updateConnection={updateConnection}
                    connection={connection}
                    details={details}
                />

                <DataAggregator
                    readOnly={readOnly}
                    details={details}
                    connection={connection}
                    currentItem={details.entity}
                    updateConnection={updateConnection}
                />
            </Row>
        );
    }

    render() {
        const { details } = this.props;

        return (
            <div className={styles.description}>
                {details instanceof CTechnicalProcess && (
                    <TechnicalProcessDescription
                        {...this.props}
                        ref={this.technicalProcessDescriptionRef}
                    />
                )}

                {details instanceof COperator && this.renderForOperator()}
            </div>
        );
    }
}

Description.propTypes = {
    isExtended: PropTypes.bool,
    updateConnection: PropTypes.func.isRequired,
};

Description.defaultProps = {
    isExtended: false,
};

export default withTheme(Description);