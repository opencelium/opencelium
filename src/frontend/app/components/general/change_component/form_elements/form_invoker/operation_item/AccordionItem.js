import React, {Component} from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Card from "react-bootstrap/Card";
import {METHOD_TYPE_TEST} from "@classes/components/content/invoker/COperation";
import OperationItem from "./OperationItem";

import styles from '@themes/default/general/change_component.scss';
import formMethodStyles from '@themes/default/general/form_methods.scss';
import {
    CONNECTOR_FROM, CONNECTOR_TO,
    INSIDE_ITEM,
    OUTSIDE_ITEM
} from "@classes/components/content/connection/CConnectorItem";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";
import {RadioButton, RadioGroup} from "react-toolbox/lib/radio";
import RequestIcon from "./request/RequestIcon";


class AccordionItem extends Component{

    constructor(props){
        super(props);

        this.state = {
            isVisible: false,
            isMouseOver: false,
            methodTypeRadioButtonVisible: false,
        };
    }

    mouseOver(){
        this.setState({isMouseOver: true});
    }

    mouseLeave(){
        this.setState({isMouseOver: false, methodTypeRadioButtonVisible: false});
    }

    toggleIsVisible(){
        this.setState({isVisible: !this.state.isVisible});
    }

    onChangeMethodType(methodType){
        const {addMethod, connector, operation} = this.props;
        const connectorType = connector.getConnectorType();
        addMethod(connectorType, methodType, operation);
        this.setState({
            methodTypeRadioButtonVisible: false,
        });
    }

    onClickAdd(){
        const {addMethod, connector, operation} = this.props;
        if(typeof addMethod === 'function') {
            const connectorType = connector.getConnectorType();
            const currentItem = connector.getCurrentItem();
            const isOperator = currentItem instanceof COperatorItem;
            if(!isOperator) {
                addMethod(connectorType, OUTSIDE_ITEM, operation);
            } else{
                this.setState({
                    methodTypeRadioButtonVisible: true,
                });
            }
        }
    }

    renderAddMethod(){
        const {connector, addMethod} = this.props;
        if(typeof addMethod === 'function') {
            const {isMouseOver, methodTypeRadioButtonVisible} = this.state;
            const connectorType = connector.getConnectorType();
            const iconStyles = {};
            if (!methodTypeRadioButtonVisible) {
                iconStyles.top = '2px';
            }
            switch (connectorType) {
                case CONNECTOR_FROM:
                    iconStyles.right = 0;
                    iconStyles.backgroundImage = 'linear-gradient(to right, rgba(0, 0, 0, 0), rgb(247, 247, 247), rgb(247, 247, 247), rgb(247, 247, 247), rgb(247, 247, 247), rgb(247, 247, 247))';
                    break;
                case CONNECTOR_TO:
                    iconStyles.left = 0;
                    iconStyles.backgroundImage = 'linear-gradient(to left, rgba(0, 0, 0, 0), rgb(247, 247, 247), rgb(247, 247, 247), rgb(247, 247, 247), rgb(247, 247, 247), rgb(247, 247, 247))';
                    break;
            }
            if (isMouseOver) {
                if (methodTypeRadioButtonVisible) {
                    const radioStyles = connectorType === CONNECTOR_FROM ? styles.radio_radio_from_connector : styles.radio_radio_to_connector;
                    const radioText = connectorType === CONNECTOR_FROM ? styles.radio_text_from_connector : styles.radio_text_to_connector;
                    return (
                        <RadioGroup
                            name='method_type'
                            value={''}
                            onChange={::this.onChangeMethodType}
                            className={connectorType === CONNECTOR_FROM ? styles.invoker_operation_add_method_radio_from_connector : styles.invoker_operation_add_method_radio_to_connector}
                        >
                            <RadioButton label='in' value={INSIDE_ITEM}
                                         theme={{
                                             field: styles.radio_field,
                                             radio: radioStyles,
                                             radioChecked: formMethodStyles.method_radio_radio_checked,
                                             text: radioText,
                                         }}/>
                            <RadioButton label='out' value={OUTSIDE_ITEM}
                                         theme={{
                                             field: styles.radio_field,
                                             radio: radioStyles,
                                             radioChecked: formMethodStyles.method_radio_radio_checked,
                                             text: radioText,
                                         }}/>
                        </RadioGroup>
                    );
                } else {
                    return (
                        <TooltipFontIcon
                            style={iconStyles}
                            className={styles.invoker_operation_add_icon}
                            tooltip={'Add'}
                            value={'add'}
                            onClick={::this.onClickAdd}
                        />
                    );
                }
            }
        }
        return null;
    }

    render(){
        const {isVisible, isMouseOver} = this.state;
        const {index, forConnection, entity, operation, readOnly, connector, ...props} = this.props;
        const connectorType = connector.getConnectorType();
        const request = operation.request.getObject();
        return(
            <div onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                {this.renderAddMethod()}
                <Accordion.Toggle as={Card.Header} eventKey={index} style={connectorType === CONNECTOR_FROM ? {textAlign: 'left'} : {textAlign: 'right'}} className={forConnection ? styles.invoker_operation_header_for_connection : styles.invoker_operation_header} onClick={::this.toggleIsVisible}>
                    <div style={{float: connectorType === CONNECTOR_FROM ? 'left' : 'right'}} className={`${forConnection ? styles.invoker_item_method_for_connection : styles.invoker_item_method} ${styles[`invoker_method_${operation.request.method.toLowerCase()}`]}`}>{operation.request.method}</div>
                    <span className={`${forConnection ? styles.invoker_item_name_for_connection : styles.invoker_item_name}`}>{operation.name}</span>
                    {readOnly && operation.type === METHOD_TYPE_TEST && !forConnection ? <div className={styles.invoker_item_method_test}>Connection Test</div> : null}
                    {forConnection ? <RequestIcon request={request} isVisible={isMouseOver} connectorType={connectorType}/> : null}
                </Accordion.Toggle>
                <Accordion.Collapse eventKey={index} >
                    <Card.Body className={forConnection ? styles.no_card_header_tabs_for_connection : styles.no_card_header_tabs}>
                        <OperationItem
                            {...props}
                            connector={connector}
                            forConnection={forConnection}
                            isVisible={isVisible}
                            index={index}
                            invoker={entity}
                            operation={operation}
                            className={styles.slider_item}
                        />
                    </Card.Body>
                </Accordion.Collapse>
            </div>
        );
    }
}

AccordionItem.defaultProps = {
    forConnection: false,
};

export default AccordionItem;