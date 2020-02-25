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
        const {index, entity, operation, readOnly, ...props} = this.props;
        return(
            <React.Fragment>
                <Accordion.Toggle as={Card.Header} eventKey={index} className={styles.invoker_operation_header} onClick={::this.toggleIsVisible}>
                    <div className={`${styles.invoker_item_method} ${styles[`invoker_method_${operation.request.method.toLowerCase()}`]}`}>{operation.request.method}</div>
                    <span className={`${styles.invoker_item_name}`}>{operation.name}</span>
                    {readOnly && operation.type === METHOD_TYPE_TEST ? <div className={styles.invoker_item_method_test}>Connection Test</div> : null}
                </Accordion.Toggle>
                <Accordion.Collapse eventKey={index} >
                    <Card.Body className={styles.no_card_header_tabs}>
                        <OperationItem
                            {...props}
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

export default AccordionItem;