import React from 'react';
import {Row, Col} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";
import {isString} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

class Description extends React.Component{
    constructor(props) {
        super(props);
    }

    renderForOperator(){
        const {details} = this.props;
        const operatorItem = details.entity;
        return(
            <Row className={styles.row}>
                <Col md={4} className={styles.col}>{`Type`}</Col>
                <Col md={8} className={styles.col}>{operatorItem.type}</Col>
                {
                    operatorItem.iterator !== '' &&
                    <React.Fragment>
                        <Col md={4} className={styles.col}>{`Iterator`}</Col>
                        <Col md={8} className={styles.col}>{operatorItem.iterator}</Col>
                    </React.Fragment>
                }
                <Col md={4} className={styles.col}>{`Condition`}</Col>
                <Col md={8} className={styles.col}>{operatorItem.condition.generateStatementText()}</Col>
            </Row>
        );
    }

    renderForProcess(){
        const {details} = this.props;
        const methodItem = details.entity;
        const request = methodItem.request;
        const successResponse = methodItem.response.success;
        const failResponse = methodItem.response.fail;
        let label = details && isString(details.label) ? details.label : '';
        let name = details && isString(details.name) ? details.name : '';
        let invoker = details && isString(details.invoker) ? details.invoker : '';
        let requestFormat = details && isString(methodItem.bodyFormat) ? methodItem.bodyFormat : '';
        if(label === '') label = 'is empty';
        if(name === '') name = 'is empty';
        if(invoker === '') invoker = 'is empty';
        if(requestFormat === '') requestFormat = 'is empty';
        let generalDataEntries = [
            {name: 'Name', value: name},
            {name: 'Label', value: label},
            {name: 'Invoker', value: invoker},
            {name: 'Format', value: requestFormat},
        ]
        return(
            <Row className={styles.row}>
                {generalDataEntries.map(entry => {
                    return(
                        <React.Fragment key={entry.name}>
                            <Col md={4} className={styles.col}>{`${entry.name}:`}</Col>
                            <Col md={8} className={styles.col}>{entry.value}</Col>
                        </React.Fragment>
                    )
                })}
                <br/>
                <br/>
                <Col md={12} className={styles.col}><b>{`Request`}</b></Col>
                <Col md={12} className={styles.col}>
                    <Row className={styles.row}>
                        <Col md={4} className={`${styles.col} ${styles.entry_padding}`}>{`Method:`}</Col>
                        <Col md={8} className={`${styles.col}`}>{request.method}</Col>
                        <Col md={4} className={`${styles.col} ${styles.entry_padding}`}>{`Endpoint`}</Col>
                        <Col md={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`URL`}</span>} tooltip={'URL'}/></Col>
                        <Col md={4} className={`${styles.col} ${styles.entry_padding}`}>{`Body`}</Col>
                        <Col md={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`...`}</span>} tooltip={'Body'}/></Col>
                    </Row>
                </Col>
                <br/>
                <br/>
                <Col md={12} className={styles.col}><b>{`Response`}</b></Col>
                <Col md={12} className={styles.col}>
                    <Row className={styles.row}>
                        <Col md={12} className={`${styles.col} ${styles.entry_padding}`}><b>{`Success`}</b></Col>
                        <Col md={4} className={`${styles.col} ${styles.entry_padding}`}>{`Status:`}</Col>
                        <Col md={8} className={`${styles.col}`}>{successResponse.status}</Col>
                        <Col md={4} className={`${styles.col} ${styles.entry_padding}`}>{`Header`}</Col>
                        <Col md={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`H`}</span>} tooltip={'Header'}/></Col>
                        <Col md={4} className={`${styles.col} ${styles.entry_padding}`}>{`Body`}</Col>
                        <Col md={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`...`}</span>} tooltip={'Body'}/></Col>
                        <br/>
                        <br/>
                        <Col md={12} className={`${styles.col} ${styles.entry_padding}`}><b>{`Fail`}</b></Col>
                        <Col md={4} className={`${styles.col} ${styles.entry_padding}`}>{`Status:`}</Col>
                        <Col md={8} className={`${styles.col}`}>{failResponse.status}</Col>
                        <Col md={4} className={`${styles.col} ${styles.entry_padding}`}>{`Header`}</Col>
                        <Col md={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`H`}</span>} tooltip={'Header'}/></Col>
                        <Col md={4} className={`${styles.col} ${styles.entry_padding}`}>{`Body`}</Col>
                        <Col md={8} className={`${styles.col} ${styles.more_details}`}><TooltipFontIcon size={14} value={<span>{`...`}</span>} tooltip={'Body'}/></Col>
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

export default Description;