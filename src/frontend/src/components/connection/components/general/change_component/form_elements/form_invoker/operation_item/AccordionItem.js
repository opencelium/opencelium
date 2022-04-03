

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
import RadioButtons from "@basic_components/inputs/RadioButtons";


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

    getRequestData(){
        const {connector, data} = this.props;
        const {connectors} = data;
        const findConnector = connectors ? connectors.find(c => c.id === connector.id) : null;
        return findConnector ? findConnector.requestData : null;
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
                    return (
                        <RadioButtons
                            className={connectorType === CONNECTOR_FROM ? styles.invoker_operation_add_method_radio_from_connector : styles.invoker_operation_add_method_radio_to_connector}
                            hasToolboxTheme={false}
                            label={''}
                            value={''}
                            handleChange={(a) => this.onChangeMethodType(a)}
                            radios={[
                                {
                                    label: 'in',
                                    value: INSIDE_ITEM,
                                    inputClassName: styles.radio_input_in,
                                    labelClassName: styles.radio_label_in,
                                },{
                                    label: 'out',
                                    value: OUTSIDE_ITEM,
                                    inputClassName: styles.radio_input_out,
                                    labelClassName: styles.radio_label_out,
                                }
                            ]}
                        />
                    );
                } else {
                    return (
                        <TooltipFontIcon
                            style={iconStyles}
                            className={styles.invoker_operation_add_icon}
                            tooltip={'Add'}
                            value={'add'}
                            onClick={(a) => this.onClickAdd(a)}
                        />
                    );
                }
            }
        }
        return null;
    }

    render(){
        const {isVisible, isMouseOver} = this.state;
        const {index, forConnection, entity, operation, readOnly, connector, addMethod, ...props} = this.props;
        const connectorType = connector ? connector.getConnectorType() : '';
        const requestData = this.getRequestData();
        const hasAddMethod = typeof addMethod === 'function';
        let accordionToggleStyle = {};
        let accordionToggleDivStyle = null;
        if(connectorType) {
            accordionToggleStyle = {textAlign: connectorType === CONNECTOR_FROM ? 'left' : 'right'};
            accordionToggleDivStyle = {float: connectorType === CONNECTOR_FROM ? 'left' : 'right'};
        }
        return(
            <div onMouseOver={(a) => this.mouseOver(a)} onMouseLeave={(a) => this.mouseLeave(a)}>
                {this.renderAddMethod()}
                <Accordion.Toggle as={Card.Header} eventKey={index} style={accordionToggleStyle} className={forConnection ? styles.invoker_operation_header_for_connection : styles.invoker_operation_header} onClick={(a) => this.toggleIsVisible(a)}>
                    <div style={accordionToggleDivStyle} className={`${forConnection ? styles.invoker_item_method_for_connection : styles.invoker_item_method} ${styles[`invoker_method_${operation.request.method.toLowerCase()}`]}`}>{operation.request.method}</div>
                    <span className={`${forConnection ? styles.invoker_item_name_for_connection : styles.invoker_item_name}`}>{operation.name}</span>
                    {readOnly && operation.type === METHOD_TYPE_TEST && !forConnection ? <div className={styles.invoker_item_method_test}>Connection Test</div> : null}
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