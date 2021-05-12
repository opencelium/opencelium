import React from 'react';
import PropTypes from 'prop-types';
import {Row, Col} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";
import {isString} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Name from './for_method/Name';
import Label from './for_method/Label';
import Endpoint from './for_method/Endpoint';
import CConnection from "@classes/components/content/connection/CConnection";

class Description extends React.Component{
    constructor(props) {
        super(props);
    }

    renderForOperator(){
        const {details} = this.props;
        const operatorItem = details.entity;
        return(
            <Row className={styles.row}>
                <Col xs={4} className={styles.col}>{`Type`}</Col>
                <Col xs={8} className={styles.col}>{operatorItem.type}</Col>
                {
                    operatorItem.iterator !== '' &&
                    <React.Fragment>
                        <Col xs={4} className={styles.col}>{`Iterator`}</Col>
                        <Col xs={8} className={styles.col}>{operatorItem.iterator}</Col>
                    </React.Fragment>
                }
                <Col xs={4} className={styles.col}>{`Condition`}</Col>
                <Col xs={8} className={styles.col}>{operatorItem.condition.generateStatementText()}</Col>
            </Row>
        );
    }

    renderForProcess(){
        const {details} = this.props;
        const methodItem = details.entity;
        const request = methodItem.request;
        const successResponse = methodItem.response.success;
        const failResponse = methodItem.response.fail;
        let invokerName = methodItem && methodItem.invoker && isString(methodItem.invoker.name) ? methodItem.invoker.name : '';
        let requestFormat = details && isString(methodItem.bodyFormat) ? methodItem.bodyFormat : '';
        if(invokerName === '') invokerName = 'is empty';
        if(requestFormat === '') requestFormat = 'is empty';
        let generalDataEntries = [
            {name: 'Invoker', value: invokerName},
            {name: 'Format', value: requestFormat},
        ]
        return(
            <Row className={styles.row}>
                <Name {...this.props}/>
                <Label {...this.props}/>
                {generalDataEntries.map(entry => {
                    return(
                        <React.Fragment key={entry.name}>
                            <Col xs={4} className={styles.col}>{`${entry.name}:`}</Col>
                            <Col xs={8} className={styles.col}>{entry.value}</Col>
                        </React.Fragment>
                    )
                })}
                <br/>
                <br/>
                <Col xs={12} className={styles.col}><b>{`Request`}</b></Col>
                <Col xs={12} className={styles.col}>
                    <Row className={styles.row}>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Method:`}</Col>
                        <Col xs={8} className={`${styles.col}`}>{request.method}</Col>
                        <Endpoint request={request}/>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Body`}</Col>
                        <Col xs={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`...`}</span>} tooltip={'Body'}/></Col>
                    </Row>
                </Col>
                <br/>
                <br/>
                <Col xs={12} className={styles.col}><b>{`Response`}</b></Col>
                <Col xs={12} className={styles.col}>
                    <Row className={styles.row}>
                        <Col xs={12} className={`${styles.col} ${styles.entry_padding}`}><b>{`Success`}</b></Col>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Status:`}</Col>
                        <Col xs={8} className={`${styles.col}`}>{successResponse.status}</Col>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Header`}</Col>
                        <Col xs={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`H`}</span>} tooltip={'Header'}/></Col>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Body`}</Col>
                        <Col xs={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`...`}</span>} tooltip={'Body'}/></Col>
                        <br/>
                        <br/>
                        <Col xs={12} className={`${styles.col} ${styles.entry_padding}`}><b>{`Fail`}</b></Col>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Status:`}</Col>
                        <Col xs={8} className={`${styles.col}`}>{failResponse.status}</Col>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Header`}</Col>
                        <Col xs={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`H`}</span>} tooltip={'Header'}/></Col>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Body`}</Col>
                        <Col xs={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`...`}</span>} tooltip={'Body'}/></Col>
                    </Row>
                </Col>
            </Row>
        );
    }

    render(){
        const {details} = this.props;
        return(
            <div className={styles.description}>
                {details instanceof CProcess && this.renderForProcess()}
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