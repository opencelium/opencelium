import React from 'react';
import PropTypes from 'prop-types';
import {Row, Col} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";
import CConnection from "@classes/components/content/connection/CConnection";
import Condition from "@change_component/form_elements/form_connection/form_svg/details/description/operator/Condition";
import OperatorType from "@change_component/form_elements/form_connection/form_svg/details/description/operator/OperatorType";
import TechnicalProcessDescription
    from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/TechnicalProcessDescription";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import BusinessProcessDescription
    from "@change_component/form_elements/form_connection/form_svg/details/description/business_process/BusinessProcessDescription";


class Description extends React.Component{
    constructor(props) {
        super(props);
    }

    renderForOperator(){
        const {details, connection, updateConnection, isExtended, currentInfo, setCurrentInfo, readOnly} = this.props;
        const operatorItem = details.entity;
        return(
            <Row className={styles.row}>
                <OperatorType readOnly={readOnly} details={details} connection={connection} updateConnection={updateConnection}/>
                {
                    operatorItem.iterator &&
                    <React.Fragment>
                        <Col xs={4} className={`${styles.col} ${styles.value}`}>{`Iterator`}</Col>
                        <Col xs={8} className={`${styles.col} ${styles.value}`}>{operatorItem.iterator}</Col>
                    </React.Fragment>
                }
                <Condition readOnly={readOnly} nameOfCurrentInfo={'operator_condition'} isCurrentInfo={currentInfo === 'operator_condition'} setCurrentInfo={setCurrentInfo} isExtended={isExtended} updateConnection={updateConnection} connection={connection} details={details}/>
            </Row>
        );
    }

    render(){
        const {details} = this.props;
        return(
            <div className={styles.description}>
                {details instanceof CTechnicalProcess && <TechnicalProcessDescription {...this.props}/>}
                {details instanceof CBusinessProcess && <BusinessProcessDescription {...this.props}/>}
                {details instanceof COperator && this.renderForOperator()}
            </div>
        );
    }
}

Description.propTypes = {
    isExtended: PropTypes.bool,
    updateConnection: PropTypes.func.isRequired,
    connection: PropTypes.instanceOf(CConnection).isRequired,
};

Description.defaultProps = {
    isExtended: false,
};

export default Description;