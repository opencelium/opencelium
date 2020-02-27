import React, {Component} from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Card from "react-bootstrap/Card";
import {METHOD_TYPE_TEST} from "../../../../../../classes/components/content/invoker/COperation";
import OperationItem from "./OperationItem";

import styles from '../../../../../../themes/default/general/change_component.scss';


class AccordionItem extends Component{

    constructor(props){
        super(props);

        this.state = {
            isVisible: false,
        };
    }

    toggleIsVisible(){
        this.setState({isVisible: !this.state.isVisible});
    }

    render(){
        const {isVisible} = this.state;
        const {index, forConnection, entity, operation, readOnly, ...props} = this.props;
        return(
            <React.Fragment>
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
            </React.Fragment>
        );
    }
}

AccordionItem.defaultProps = {
    forConnection: false,
};

export default AccordionItem;