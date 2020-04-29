import React, {Component} from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Card from "react-bootstrap/Card";
import {METHOD_TYPE_TEST} from "../../../../../../classes/components/content/invoker/COperation";
import OperationItem from "./OperationItem";

import styles from '../../../../../../themes/default/general/change_component.scss';
import formMethodStyles from '../../../../../../themes/default/general/form_methods.scss';
import {INSIDE_ITEM, OUTSIDE_ITEM} from "../../../../../../classes/components/content/connection/CConnectorItem";
import TooltipFontIcon from "../../../../basic_components/tooltips/TooltipFontIcon";
import COperatorItem from "../../../../../../classes/components/content/connection/operator/COperatorItem";
import {RadioButton, RadioGroup} from "react-toolbox/lib/radio";


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
        const {isMouseOver, methodTypeRadioButtonVisible} = this.state;
        if(isMouseOver) {
            if(methodTypeRadioButtonVisible){
                return(
                    <RadioGroup
                        name='method_type'
                        value={''}
                        onChange={::this.onChangeMethodType}
                        className={styles.invoker_operation_add_method_radio}
                    >
                        <RadioButton label='in' value={INSIDE_ITEM}
                                     theme={{field: styles.radio_field, radio: styles.radio_radio, radioChecked: formMethodStyles.method_radio_radio_checked, text: styles.radio_text}}/>
                        <RadioButton label='out' value={OUTSIDE_ITEM}
                                     theme={{field: styles.radio_field, radio: styles.radio_radio, radioChecked: formMethodStyles.method_radio_radio_checked, text: styles.radio_text}}/>
                    </RadioGroup>
                );
            } else {
                return (
                    <TooltipFontIcon
                        style={{top: '2px'}}
                        className={styles.invoker_operation_add_icon}
                        tooltip={'Add'}
                        value={'add'}
                        onClick={::this.onClickAdd}
                    />
                );
            }
        }
        return null;
    }

    render(){
        const {isVisible} = this.state;
        const {index, forConnection, entity, operation, readOnly, ...props} = this.props;
        return(
            <div onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                {this.renderAddMethod()}
                <Accordion.Toggle as={Card.Header} eventKey={index} className={forConnection ? styles.invoker_operation_header_for_connection : styles.invoker_operation_header} onClick={::this.toggleIsVisible}>
                    <div className={`${forConnection ? styles.invoker_item_method_for_connection : styles.invoker_item_method} ${styles[`invoker_method_${operation.request.method.toLowerCase()}`]}`}>{operation.request.method}</div>
                    <span className={`${forConnection ? styles.invoker_item_name_for_connection : styles.invoker_item_name}`}>{operation.name}</span>
                    {readOnly && operation.type === METHOD_TYPE_TEST && !forConnection ? <div className={styles.invoker_item_method_test}>Connection Test</div> : null}
                </Accordion.Toggle>
                <Accordion.Collapse eventKey={index} >
                    <Card.Body className={forConnection ? styles.no_card_header_tabs_for_connection : styles.no_card_header_tabs}>
                        <OperationItem
                            {...props}
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