/*
 *  Copyright (C) <2023>  <becon GmbH>
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
import {DeleteButtonStyled, HeaderStyled, MethodTitleStyled, OperationItemsStyled,
    RightContainerStyled, TestConnectionIconStyled, ValidationMessageStyled} from './styles';
import {TextSize} from "@app_component/base/text/interfaces";
import {isJsonString} from "@application/utils/utils";
import {ErrorStyled} from "@app_component/base/input/styles";
import {Text} from "@app_component/base/text/Text";

const OperationItems: FC<OperationItemsProps> =
    ({
        operations,
        isReadonly,
        updateOperations,
        validations,
        error,
    }) => {
    const [collapseKey, setCollapseKey] = useState('');
    const [newOperation, setNewOperation] = useState<Operation>(new Operation());
    const [newNameValidation, setNewNameValidation] = useState<string>('');
    const [newMethodValidation, setNewMethodValidation] = useState<string>('');
    const updateNewOperation = (operation: IOperation) => {
        setNewOperation(new Operation({...operation}));
        setNewNameValidation('');
        setNewMethodValidation('');
    }
    const toggle = (e: any) => {
        let event = e.target.dataset.event;
        if(!event){
            event = e.target.parentElement.dataset.event;
        }
        setCollapseKey(collapseKey === event ? '' : event)
    }
    const addOperation = () => {
        let isValid = true;
        if(newOperation.name === ''){
            isValid = false;
            setNewNameValidation('Name is a required field');
        }
        if(!newOperation.request.method){
            isValid = false;
            setNewMethodValidation('Method is a required field');
        }
        if(operations.findIndex(o => o.name === newOperation.name) !== -1){
            isValid = false;
            setNewNameValidation('Operation with such name already exists');
        }
        if(!isValid){
            return;
        }
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
    const hasTestConnectionSwitch = operations.findIndex(operation => operation.type === 'test') === -1;
    return (
        <OperationItemsStyled>
            <Card key={'operation_add'}>
                <CardHeader onClick={toggle} data-event={'operation_add'}>
                    <HeaderStyled onClick={toggle}>{newOperation.name || 'New Operation'}</HeaderStyled>
                    <MethodTitleStyled onClick={toggle} method={newOperation.request.method}>{newOperation.request.method || ''}</MethodTitleStyled>
                </CardHeader>
                <Collapse isOpen={collapseKey === 'operation_add'}>
                    <CardBody>
                        <OperationItem index={'operation_add'} methodValidationMessage={newMethodValidation} nameValidationMessage={newNameValidation} hasTestConnectionSwitch={hasTestConnectionSwitch} isReadonly={isReadonly} operationItem={newOperation} updateOperation={updateNewOperation}/>
                        <div style={{textAlign: 'right'}}><Button icon={'add'} handleClick={addOperation} label={'Add Operation'}/></div>
                    </CardBody>
                </Collapse>
            </Card>
            {operations.map((operation: Operation, index) => {
                const validationMessage = validations.find(v => v.index === index)?.message || '';
                return (
                    <Card key={operation.uniqueIndex}>
                        <CardHeader onClick={toggle} data-event={operation.uniqueIndex}>
                            <HeaderStyled onClick={toggle}>
                                {operation.name}
                                {!!validationMessage && <ValidationMessageStyled>({validationMessage})</ValidationMessageStyled>}
                            </HeaderStyled>
                            <RightContainerStyled>
                                <TestConnectionIconStyled name={operation.type === 'test' ? 'verified' : ' '}/>
                                <MethodTitleStyled onClick={toggle} method={operation.request.method}>{operation.request.method || ''}</MethodTitleStyled>
                                {!isReadonly && <DeleteButtonStyled hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => deleteOperation(operation, index)} icon={'delete'} hasBackground={false} color={ColorTheme.DarkBlue}/>}
                            </RightContainerStyled>
                        </CardHeader>
                        <Collapse isOpen={collapseKey === operation.uniqueIndex}>
                            <CardBody>
                                <OperationItem index={`${index}`} hasTestConnectionSwitch={hasTestConnectionSwitch} isReadonly={isReadonly} operationItem={operation} updateOperation={(operation: Operation) => updateExistOperation(operation, index)}/>
                            </CardBody>
                        </Collapse>
                    </Card>
                )})
            }
            <ErrorStyled errorBottom={'2px'} paddingLeft={'12px'}><Text value={error} size={TextSize.Size_12} color={ColorTheme.Red}/></ErrorStyled>
        </OperationItemsStyled>
    )
}

OperationItems.defaultProps = {
    isReadonly: false,
    operations: [],
    validations: [],
    error: '',
}


export {
    OperationItems,
};

export default withTheme(OperationItems);
