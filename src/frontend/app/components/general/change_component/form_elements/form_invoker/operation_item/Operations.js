/*
 * Copyright (C) <2020>  <becon GmbH>
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
import OperationItem from "./OperationItem";
import TooltipFontIcon from "../../../../basic_components/tooltips/TooltipFontIcon";
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';

import styles from '../../../../../../themes/default/general/change_component.scss';
import COperation, {METHOD_TYPE_TEST} from "../../../../../../classes/components/content/invoker/COperation";
import AccordionItem from "./AccordionItem";


class Operations extends Component{

    constructor(props){
        super(props);

        this.state = {
            addOperationState: COperation.createOperation(),
        };
        this.justAdded = false;
    }

    updateEntity(){
        const {entity, updateEntity, readOnly, forConnection} = this.props;
        if(!readOnly && !forConnection) {
            updateEntity(entity);
        }
    }

    updateAddOperation(){
        this.setState({
            addOperationState: this.state.addOperationState,
        });
    }

    openAddOperation(){
        let addInvokerHeader = document.getElementById('add_invoker_header');
        if(!addInvokerHeader.nextSibling.classList.contains('show')){
            addInvokerHeader.click();
        }
    }

    addOperation(){
        const {addOperationState} = this.state;
        const {entity} = this.props;
        if(addOperationState.name === ''){
            this.openAddOperation();
            setTimeout(function(){
                let addInvokerName = document.getElementById('add_invoker_name');
                if(addInvokerName) {
                    addInvokerName.focus();
                }
            }, 100);
        } else {
            this.justAdded = true;
            entity.addOperation(addOperationState);
            this.updateEntity();
            this.setState({
                addOperationState: COperation.createOperation()
            });
        }
    }

    renderOperations(){
        const {entity, ...props} = this.props;
        let {readOnly} = this.props.data;
        let operations = readOnly ? entity.operations : entity.getOperationsWithoutConnection();
        return operations.map((operation, key) => {
            return (
                <Card key={key}>
                    <AccordionItem
                        {...props}
                        index={key}
                        entity={entity}
                        operation={operation}
                        readOnly={readOnly}
                        updateEntity={::this.updateEntity}
                    />
                </Card>
            );
        });
    }

    renderAddIcon(){
        const {tourSteps} = this.props.data;
        this.justAdded = false;
        return (
            <div style={{textAlign: 'center'}}>
                <TooltipFontIcon
                    value={'add'}
                    tooltip={'Add Operation'}
                    onClick={::this.addOperation}
                    style={{cursor: 'pointer'}}
                    className={tourSteps && tourSteps.length >= 7 ? tourSteps[6].selector.substr(1): ''}
                />
            </div>
        );
    }

    renderAddOperation(){
        const {addOperationState} = this.state;
        const {entity, ...props} = this.props;
        let operations = entity.getOperationsWithoutConnection();
        return (
            <Card style={operations.length === 0 ? {border: '1px solid #00000020'} : null}>
                <Accordion.Toggle as={Card.Header} eventKey={operations.length} id={'add_invoker_header'} className={styles.invoker_operation_header}>
                    {'Add Operation'}
                </Accordion.Toggle>
                <Accordion.Collapse eventKey={operations.length}>
                    <Card.Body className={styles.no_card_header_tabs}>
                        <OperationItem
                            {...props}
                            isVisible={true}
                            updateEntity={::this.updateAddOperation}
                            operation={addOperationState}
                            invoker={entity}
                            ids={{name:'add_invoker_name'}}
                            hasTour
                            justAdded={this.justAdded}
                        />
                    </Card.Body>
                </Accordion.Collapse>
            </Card>

        );
    }

    render(){
        const {readOnly} = this.props.data;
        return (
            <div>
                <Accordion defaultActiveKey="0">
                    {this.renderOperations()}
                    {readOnly ? null : this.renderAddOperation()}
                </Accordion>
                {readOnly ? null : this.renderAddIcon()}
            </div>
        );
    }
}

export default Operations;