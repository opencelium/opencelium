/*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useState} from 'react';
import { Collapse, CardBody, Card, CardHeader } from 'reactstrap';
import {withTheme} from "styled-components";
import Button from "@app_component/base/button/Button";
import {ColorTheme} from "@style/Theme";
import {IOperation} from "../../interfaces/IOperation";
import {Operation} from "../../classes/Operation";
import OperationItem from "../operation_item/OperationItem";
import { OperationItemsProps } from './interfaces';
import {DeleteButtonStyled, HeaderStyled, MethodTitleStyled, OperationItemsStyled} from './styles';

const OperationItems: FC<OperationItemsProps> =
    ({
        operations,
        isReadonly,
        updateOperations,
    }) => {
    const [collapseKey, setCollapseKey] = useState('');
    const [newOperation, setNewOperation] = useState<Operation>(new Operation());
    const updateNewOperation = (operation: IOperation) => {
        setNewOperation(new Operation({...operation}));
    }
    const toggle = (e: any) => {
        let event = e.target.dataset.event;
        if(!event){
            event = e.target.parentElement.dataset.event;
        }
        setCollapseKey(collapseKey === event ? '' : event)
    }
    const addOperation = () => {
        let newOperations: Operation[] = [...operations];
        newOperations.unshift(newOperation);
        updateOperations(newOperations);
        setNewOperation(new Operation());
    }
    const deleteOperation = (operation: Operation, index: number) => {
        let newOperations = [...operations];
        newOperations.splice(index, 1);
        updateOperations(newOperations);
    }
    const updateExistOperation = (operation: Operation, index: number) => {
        let newOperations = [...operations];
        newOperations[index] = new Operation({...operation});
        updateOperations(newOperations);
    }
    return (
        <OperationItemsStyled>
            <Card key={'operation_add'}>
                <CardHeader onClick={toggle} data-event={'operation_add'}>
                    <HeaderStyled onClick={toggle}>{newOperation.name || 'New Operation'}</HeaderStyled>
                    <MethodTitleStyled onClick={toggle} method={newOperation.request.method}>{newOperation.request.method || ''}</MethodTitleStyled>
                </CardHeader>
                <Collapse isOpen={collapseKey === 'operation_add'}>
                    <CardBody>
                        <OperationItem isReadonly={isReadonly} operationItem={newOperation} updateOperation={updateNewOperation}/>
                        <div style={{textAlign: 'center'}}><Button icon={'add'} handleClick={addOperation}/></div>
                    </CardBody>
                </Collapse>
            </Card>
            {operations.map((operation: Operation, index) => {
                return (
                    <Card key={operation.uniqueIndex}>
                        <CardHeader onClick={toggle} data-event={operation.uniqueIndex}>
                            <HeaderStyled onClick={toggle}>{operation.name}</HeaderStyled>
                            {!isReadonly && <DeleteButtonStyled hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => deleteOperation(operation, index)} icon={'delete'} hasBackground={false} color={ColorTheme.DarkBlue}/>}
                            <MethodTitleStyled onClick={toggle} method={operation.request.method}>{operation.request.method || ''}</MethodTitleStyled>
                        </CardHeader>
                        <Collapse isOpen={collapseKey === operation.uniqueIndex}>
                            <CardBody>
                                <OperationItem isReadonly={isReadonly} operationItem={operation} updateOperation={(operation: Operation) => updateExistOperation(operation, index)}/>
                            </CardBody>
                        </Collapse>
                    </Card>
                )})
            }
        </OperationItemsStyled>
    )
}

OperationItems.defaultProps = {
    isReadonly: false,
    operations: [],
}


export {
    OperationItems,
};

export default withTheme(OperationItems);