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

import React, {ChangeEvent, FC, useEffect, useState} from "react";
import {Nav, NavItem, TabContent, TabPane} from "reactstrap";
import { REQUEST_METHOD } from "@application/requests/interfaces/IApplication";
import InputRadios from "@app_component/base/input/radio/InputRadios";
import {InputTextType} from "@app_component/base/input/text/interfaces";
import {Operation} from "../../classes/Operation";
import {Name} from "../operation/name/Name";
import {Endpoint} from "../operation/endpoint/Endpoint";
import {SuccessStatus} from "../operation/status/SuccessStatus";
import {FailStatus} from "../operation/status/FailStatus";
import {Data} from "../operation/data/Data";
import {Format} from "../operation/format/Format";
import {Type} from "../operation/type/Type";
import {Body} from "../operation/body/Body";
import {Header} from "../operation/header/Header";
import {NavLinkStyled} from "./styles";
import {OperationItemProps} from "./interfaces";


const OperationItem: FC<OperationItemProps> = (
    {
        operationItem,
        isReadonly,
        updateOperation,
    }) => {
    const [tab, setTab] = useState(1);
    const [method, setMethod] = useState(operationItem?.request?.method || '');
    const [requestHeader, setRequestHeader] = useState(operationItem?.request?.header || {});
    const [requestBodyFields, setRequestBodyFields] = useState(operationItem?.request?.body?.fields || {});
    const updateRequestHeader = (value: any) => {
        operationItem.request.header = value;
        updateOperation(operationItem);
    }
    const updateRequestBodyFields = (value: any) => {
        operationItem.request.body.fields = value;
        updateOperation(operationItem);
    }
    const [successHeader, setSuccessHeader] = useState(operationItem?.response?.success?.header || {});
    const [successBodyFields, setSuccessBodyFields] = useState(operationItem?.response?.success?.body?.fields || {});
    const updateSuccessHeader = (value: any) => {
        operationItem.response.success.header = value;
        updateOperation(operationItem);
    }
    const updateSuccessBodyFields = (value: any) => {
        operationItem.response.success.body.fields = value;
        updateOperation(operationItem);
    }
    const [failHeader, setFailHeader] = useState(operationItem?.response?.fail?.header || {});
    const [failBodyFields, setFailBodyFields] = useState(operationItem?.response?.fail?.body?.fields || {});
    const updateFailHeader = (value: any) => {
        operationItem.response.fail.header = value;
        updateOperation(operationItem);
    }
    const updateFailBodyFields = (value: any) => {
        operationItem.response.fail.body.fields = value;
        updateOperation(operationItem);
    }
    useEffect(() => {
        if(operationItem instanceof Operation){
            setMethod(operationItem.request.method);
            setRequestHeader(operationItem.request.header);
            setRequestBodyFields(operationItem.request.body.fields);
            setSuccessHeader(operationItem.response.success.header);
            setSuccessBodyFields(operationItem.response.success.body.fields);
            setFailHeader(operationItem.response.fail.header);
            setFailBodyFields(operationItem.response.fail.body.fields);
        }
    }, [operationItem]);
    return(
        <React.Fragment>
            <Name
                label={'Name'}
                icon={'person'}
                readOnly={isReadonly}
                error={''}
                operationItem={operationItem}
                updateOperation={updateOperation}
            />
            <Endpoint
                label={'Endpoint'}
                icon={'http'}
                readOnly={isReadonly}
                error={''}
                operationItem={operationItem}
                updateOperation={updateOperation}
            />
            <InputRadios
                icon={'public'}
                label={'Method'}
                options={[
                    {
                        label: 'POST',
                        value: REQUEST_METHOD.POST,
                        key: REQUEST_METHOD.POST,
                    },{
                        label: 'GET',
                        value: REQUEST_METHOD.GET,
                        key: REQUEST_METHOD.GET,
                    },{
                        label: 'PUT',
                        value: REQUEST_METHOD.PUT,
                        key: REQUEST_METHOD.PUT,
                    },{
                        label: 'DELETE',
                        value: REQUEST_METHOD.DELETE,
                        key: REQUEST_METHOD.DELETE,
                }]}
                readOnly={isReadonly}
                error={''}
                onChange={(e:ChangeEvent<HTMLInputElement>) => {
                    setMethod(e.target.value);
                    // @ts-ignore
                    operationItem.request.method = e.target.value;
                    updateOperation(operationItem);

                }}
                value={method}
            />
            <Nav tabs style={{display: method ? 'flex' : 'none'}}>
                <NavItem>
                    <NavLinkStyled onClick={() => {setTab(1);}} active={tab === 1}>Request</NavLinkStyled>
                </NavItem>
                <NavItem>
                    <NavLinkStyled onClick={() => {setTab(2);}} active={tab === 2}>Response (success)</NavLinkStyled>
                </NavItem>
                <NavItem>
                    <NavLinkStyled onClick={() => {setTab(3);}} active={tab === 3}>Response (fail)</NavLinkStyled>
                </NavItem>
            </Nav>
            <TabContent activeTab={tab} style={{display: method ? 'block' : 'none', marginTop: '10px'}}>
                <TabPane tabId={1}>
                    <Header
                        updateHeader={updateRequestHeader}
                        value={requestHeader}
                        readOnly={isReadonly}
                    />
                    <Data
                        readOnly={isReadonly}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                        onChange={(e:ChangeEvent<HTMLInputElement>) => {
                            // @ts-ignore
                            operationItem.request.body.data = e.target.value;
                            updateOperation(operationItem);
                        }}
                        value={operationItem.request.body.data}
                    />
                    <Format
                        readOnly={isReadonly}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                        onChange={(e:ChangeEvent<HTMLInputElement>) => {
                            // @ts-ignore
                            operationItem.request.body.format = e.target.value;
                            updateOperation(operationItem);
                        }}
                        value={operationItem.request.body.format}
                    />
                    <Type
                        readOnly={isReadonly}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                        onChange={(e:ChangeEvent<HTMLInputElement>) => {
                            // @ts-ignore
                            operationItem.request.body.setType(e.target.value);
                            updateOperation(operationItem);
                        }}
                        value={operationItem.request.body.type}
                    />
                    <Body
                        format={operationItem.request.body.format}
                        updateBody={updateRequestBodyFields}
                        value={requestBodyFields}
                        readOnly={isReadonly}
                    />
                </TabPane>
                <TabPane tabId={2}>
                    <Header
                        updateHeader={updateSuccessHeader}
                        value={successHeader}
                        readOnly={isReadonly}
                    />
                    <Data
                        readOnly={isReadonly}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                        onChange={(e:ChangeEvent<HTMLInputElement>) => {
                            // @ts-ignore
                            operationItem.response.success.body.data = e.target.value;
                            updateOperation(operationItem);
                        }}
                        value={operationItem.response.success.body.data}
                    />
                    <Format
                        readOnly={isReadonly}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                        onChange={(e:ChangeEvent<HTMLInputElement>) => {
                            // @ts-ignore
                            operationItem.response.success.body.format = e.target.value;
                            updateOperation(operationItem);
                        }}
                        value={operationItem.response.success.body.format}
                    />
                    <Type
                        readOnly={isReadonly}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                        onChange={(e:ChangeEvent<HTMLInputElement>) => {
                            // @ts-ignore
                            operationItem.response.success.body.setType(e.target.value);
                            updateOperation(operationItem);
                        }}
                        value={operationItem.response.success.body.type}
                    />
                    <SuccessStatus
                        type={InputTextType.Number}
                        label={'Status'}
                        icon={'all_inclusive'}
                        readOnly={isReadonly}
                        error={''}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                    />
                    <Body
                        format={operationItem.response.success.body.format}
                        updateBody={updateSuccessBodyFields}
                        value={successBodyFields}
                        readOnly={isReadonly}
                    />
                </TabPane>
                <TabPane tabId={3}>
                    <Header
                        updateHeader={updateFailHeader}
                        value={failHeader}
                        readOnly={isReadonly}
                    />
                    <Data
                        readOnly={isReadonly}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                        value={operationItem.response.fail.body.data}
                        onChange={(e) => {
                            // @ts-ignore
                            operationItem.response.fail.body.data = e.target.value;
                            updateOperation(operationItem);
                        }}
                    />
                    <Format
                        readOnly={isReadonly}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                        onChange={(e:ChangeEvent<HTMLInputElement>) => {
                            // @ts-ignore
                            operationItem.response.fail.body.format = e.target.value;
                            updateOperation(operationItem);
                        }}
                        value={operationItem.response.fail.body.format}
                    />
                    <Type
                        readOnly={isReadonly}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                        onChange={(e:ChangeEvent<HTMLInputElement>) => {
                            // @ts-ignore
                            operationItem.response.fail.body.setType(e.target.value);
                            updateOperation(operationItem);
                        }}
                        value={operationItem.response.fail.body.type}
                    />
                    <FailStatus
                        type={InputTextType.Number}
                        label={'Status'}
                        icon={'all_inclusive'}
                        readOnly={isReadonly}
                        error={''}
                        operationItem={operationItem}
                        updateOperation={updateOperation}
                    />
                    <Body
                        format={operationItem.response.fail.body.format}
                        updateBody={updateFailBodyFields}
                        value={failBodyFields}
                        readOnly={isReadonly}
                    />
                </TabPane>
            </TabContent>
        </React.Fragment>
    )
}

OperationItem.defaultProps = {
    operationItem: null,
    isReadonly: false,
}

export default OperationItem;