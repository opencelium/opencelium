import React from 'react';
import PropTypes from 'prop-types';
import {Row, Col} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";
import CConnection from "@classes/components/content/connection/CConnection";
import {isString} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Name from './process/Name';
import Label from './process/Label';
import Url from './process/Url';
import Header from './process/Header';
import Body from './process/Body';
import Condition from "@change_component/form_elements/form_connection/form_svg/details/description/operator/Condition";
import OperatorType from "@change_component/form_elements/form_connection/form_svg/details/description/operator/OperatorType";


class Description extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isResponseVisible: false,
        };
    }

    toggleResponseVisibleIcon(){
        this.setState({
            isResponseVisible: !this.state.isResponseVisible,
        })
    }

    renderForOperator(){
        const {details, connection, updateConnection} = this.props;
        const operatorItem = details.entity;
        return(
            <Row className={styles.row}>
                <OperatorType details={details} connection={connection} updateConnection={updateConnection}/>
                {
                    operatorItem.iterator &&
                    <React.Fragment>
                        <Col xs={4} className={styles.col}>{`Iterator`}</Col>
                        <Col xs={8} className={`${styles.col} ${styles.value}`}>{operatorItem.iterator}</Col>
                    </React.Fragment>
                }
                <Condition updateConnection={updateConnection} connection={connection} details={details} readOnly={false}/>
            </Row>
        );
    }

    renderForProcess(){
        const {isResponseVisible} = this.state;
        const {details, connection, updateConnection} = this.props;
        const methodItem = details.entity;
        const connector = connection.getConnectorByType(details.connectorType);
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
                            <Col xs={8} className={`${styles.col}`}><span className={styles.value}>{entry.value}</span></Col>
                        </React.Fragment>
                    )
                })}
                <br/>
                <br/>
                <Col xs={12} className={styles.col}><b>{`Request`}</b></Col>
                <Col xs={12} className={styles.col}>
                    <Row className={styles.row}>
                        <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Method:`}</Col>
                        <Col xs={8} className={`${styles.col}`}><span className={styles.value}>{request.method}</span></Col>
                        <Url request={request} connection={connection} updateConnection={updateConnection} method={methodItem} connector={connector}/>
                        <Header items={request.header}/>
                        <Body source={request.getBodyFields()} connection={connection} connector={connector} updateConnection={updateConnection} method={methodItem} bodyTitle={'Request data'}/>
                    </Row>
                </Col>
                <br/>
                <br/>
                <Col xs={12} className={styles.col}>
                    <b>{`Response`}</b>
                    <TooltipFontIcon className={styles.response_toggle_icon} onClick={::this.toggleResponseVisibleIcon} tooltip={isResponseVisible ? 'Hide' : 'Show'} value={isResponseVisible ? 'arrow_drop_up' : 'arrow_drop_down'}/>
                </Col>
                {isResponseVisible &&
                    <Col xs={12} className={styles.col}>
                        <Row className={styles.row}>
                            <Col xs={12} className={`${styles.col} ${styles.entry_padding}`}><b>{`Success`}</b></Col>
                            <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Status:`}</Col>
                            <Col xs={8} className={`${styles.col}`}>{successResponse.status}</Col>
                            <Header items={successResponse.header}/>
                            <Body source={successResponse.getBodyFields()} readOnly={true} connection={connection} connector={connector} updateConnection={updateConnection} method={methodItem} bodyTitle={'Response. Success data'}/>
                            <br/>
                            <br/>
                            <Col xs={12} className={`${styles.col} ${styles.entry_padding}`}><b>{`Fail`}</b></Col>
                            <Col xs={4} className={`${styles.col} ${styles.entry_padding}`}>{`Status:`}</Col>
                            <Col xs={8} className={`${styles.col}`}>{failResponse.status}</Col>
                            <Header items={failResponse.header}/>
                            <Body source={failResponse.getBodyFields()} readOnly={true} connection={connection} connector={connector} updateConnection={updateConnection} method={methodItem} bodyTitle={'Response. Fail data'}/>
                        </Row>
                    </Col>
                }
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