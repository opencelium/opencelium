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

import React from 'react';
import {withTranslation} from 'react-i18next';
import {isJsonString, subArrayToString, isString, isNumber} from "@application/utils/utils";
import {CONNECTOR_FROM} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import Enhancement from "@change_component/form_elements/form_connection/form_methods/mapping/enhancement/Enhancement";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import ParamGenerator from "@change_component/form_elements/form_connection/form_methods/method/ParamGenerator";
import styles from '@entity/connection/components/themes/default/general/form_methods.scss';
import Input from "@entity/connection/components/components/general/basic_components/inputs/Input";
import CRequest from "@entity/connection/components/classes/components/content/invoker/request/CRequest";
import ToolboxThemeInput from "../hocs/ToolboxThemeInput";
import {markFieldNameAsArray} from "@change_component//form_elements/form_connection/form_methods/help";


export function RequestBody(CRequestType){
    return function (Component) {
        return (
            class C extends React.Component{

                constructor(props){
                    super(props);
                    this.paramGenerator = React.createRef();

                    this.state = {
                        showImportJson: false,
                        isBodyEditOpened: false,
                        importJsonBody: JSON.stringify( props.method.request instanceof CRequest ? props.method.request.getBodyFields() : {}),
                        showEnhancement: false,
                        currentEnhancement: null,
                    };
                }

                toggleEnhancement(){
                    this.setState({
                        showEnhancement: !this.state.showEnhancement,
                    });
                }

                openBodyEdit(){
                    const {connector, method, updateEntity} = this.props;
                    connector.setCurrentItem(method);
                    updateEntity();
                    this.setState({isBodyEditOpened: true});
                }

                closeBodyEdit(){
                    this.setState({isBodyEditOpened: false});
                }

                /**
                 * to show/hide import json
                 */
                toggleImportJson(){
                    this.setState({showImportJson: !this.state.showImportJson});
                }

                /**
                 * to set import json value
                 */
                onChangeImportJsonBody(importJsonBody){
                    this.setState({
                        importJsonBody,
                    });
                }

                /**
                 * to import json
                 */
                importJson(){
                    let {importJsonBody} = this.state;
                    if(isJsonString(importJsonBody)) {
                        //const referenceRegExp = /\"\#[0-9a-fA-F]{6}\.\((request|response)\)\.[^\"]*\"/g;
                        //importJsonBody = JSON.parse(JSON.stringify(importJsonBody).replace(referenceRegExp, '"\\"'));
                        this.updateBody({updated_src: JSON.parse(importJsonBody)});
                        this.toggleImportJson();
                    } else{
                        alert('Not JSON format');
                    }
                }

                getCurrentBindingItem(fieldName){
                    const {connection, method} = this.props;
                    return connection.fieldBinding.find(item => {
                        return item.to.findIndex(elem => {
                            let name = elem.field.replace('[]', '');
                            return elem.color === method.color && name === fieldName;
                        }) !== -1;
                    });
                }

                /*
                * to open an enhancement when click on pointer
                 */
                openEnhancement(e, value){
                    const {connector, connection} = this.props;
                    /*if(connector.getConnectorType() === CONNECTOR_FROM){
                        return;
                    }*/
                    let fieldName = '';
                    if(value.namespace.length > 1){
                        for(let i = 1; i < value.namespace.length; i++){
                            if((i + 1) < value.namespace.length && isNumber(value.namespace[i + 1])){
                                fieldName += markFieldNameAsArray(value.namespace[i], value.namespace[i + 1]);
                                i++;
                            } else{
                                fieldName += value.namespace[i];
                            }
                            fieldName += '.';
                        }
                    }
                    fieldName += value.variable.name;
                    let bindingItem = this.getCurrentBindingItem(fieldName);
                    if(bindingItem){
                        bindingItem = bindingItem.to[0];
                        this.props.connection.setCurrentFieldBindingTo(bindingItem);
                    }
                    this.setState({
                        currentEnhancement: connection.getEnhancementByTo(),
                        showEnhancement: !this.state.showEnhancement,
                    });
                }

                setCurrentEnhancement(currentEnhancement){
                    this.setState({
                        currentEnhancement,
                    });
                }

                /**
                 * to update enhancement in entity
                 */
                updateEnhancement(){
                    const {currentEnhancement} = this.state;
                    const {connection, updateEntity} = this.props;
                    connection.updateEnhancement(currentEnhancement);
                    updateEntity();
                    this.toggleEnhancement();
                }

                /**
                 * to update body
                 */
                updateBody(bodyData){
                    const {connection, connector, method, updateEntity} = this.props;
                    connector.setCurrentItem(method);
                    CRequestType.updateFieldsBinding(connection, connector, method, CRequestType.convertForFieldBinding(bodyData));
                    method.setRequestBodyFields(CRequestType.convertToBodyFormat(bodyData));
                    updateEntity();
                }

                getEnhancementData(){
                    const { currentEnhancement} = this.state;
                    const {readOnly, connection, method} = this.props;
                    if(!(connection instanceof CConnection)){
                        return null;
                    }
                    let bindingItem = connection.fieldBinding.find(item => item.to.findIndex(elem => elem.color === method.color) !== -1);
                    if(!bindingItem){
                        return null;
                    }
                    bindingItem = bindingItem.getObject();
                    bindingItem.enhancement = null;
                    return {
                        binding: bindingItem,
                        setEnhancement: (a) => this.setCurrentEnhancement(a),
                        readOnly,
                        enhancement: currentEnhancement
                    };
                }

                getEnhancementComponent(){
                    const data = this.getEnhancementData();
                    if(!data){
                        return null;
                    }
                    return (
                        <div>
                            <Enhancement
                                {...data}
                            />
                        </div>
                    );
                }

                renderEnhancement(){
                    const {showEnhancement} = this.state;
                    const {noPlaceholder} = this.props;
                    return (
                        <Dialog
                            actions={[{label: 'Ok', onClick: () => this.updateEnhancement(), id: 'body_ok'}, {label: 'Cancel', onClick: () => this.toggleEnhancement(), id: 'body_cancel'}]}
                            active={showEnhancement && !noPlaceholder}
                            toggle={() => this.toggleEnhancement()}
                            title={'Enhancement'}
                            theme={{dialog: styles.enhancement_dialog}}
                        >
                            {this.getEnhancementComponent()}
                        </Dialog>
                    );
                }

                renderDialogImportJson(){
                    let {showImportJson, importJsonBody} = this.state;
                    importJsonBody = !isString(importJsonBody) ? JSON.stringify(importJsonBody) : importJsonBody;
                    return (
                        <Dialog
                            actions={[{label: 'Ok', onClick: () => this.importJson()}, {label: 'Cancel', onClick: () => this.toggleImportJson()}]}
                            active={showImportJson}
                            toggle={() => this.toggleImportJson()}
                            title={'Import Json'}
                            theme={{dialog: styles.enhancement_dialog}}
                        >
                            <Input
                                className={styles.textarea_import_json}
                                name={'json'}
                                type={'text'}
                                onChange={(a) => this.onChangeImportJsonBody(a)}
                                value={importJsonBody}
                                label={'json'}
                                multiline
                                rows={7}
                            />
                        </Dialog>
                    );
                }

                renderPlaceholder(){
                    const {method} = this.props;
                    let hasError = false;
                    if(method.error && method.error.hasError){
                        if(method.error.location === 'body'){
                            hasError = true;
                        }
                    }
                    return(
                        <React.Fragment>
                            <TooltipFontIcon
                                isButton={true}
                                className={styles.method_body_placeholder}
                                tooltip={'more details'}
                                value={<span>{CRequestType.getPlaceholder()}</span>}
                                style={hasError ? {color: 'red'} : {}}
                                onClick={() => this.openBodyEdit()}/>
                        </React.Fragment>
                    );
                }

                renderCloseMenuEditButton(){
                    return (
                        <TooltipFontIcon
                            size={16}
                            isButton={true}
                            className={styles.body_close_menu_edit}
                            value={'check_circle_outline'}
                            tooltip={'Apply'}
                            onClick={() => this.closeBodyEdit()}
                        />
                    );
                }

                render(){
                    const {isBodyEditOpened} = this.state;
                    const {requestBodyClassName, ...componentProps} = this.props;
                    const {id, readOnly, method, connector, connection, bodyStyles, isDraft, noPlaceholder, openEnhancement, updateEntity} = this.props;
                    if(!isBodyEditOpened && !noPlaceholder){
                        return this.renderPlaceholder();
                    }
                    let ownBodyStyles = {left: '-20px'};
                    let hasReferenceComponent = !(method.index === '0' && connector.getConnectorType() === CONNECTOR_FROM);
                    if(bodyStyles){
                        ownBodyStyles = bodyStyles;
                    }
                    return(
                        <ToolboxThemeInput className={`${requestBodyClassName ? `${requestBodyClassName} ` : ''}${styles[CRequestType.getClassName({isDraft, noPlaceholder})]}`} style={ownBodyStyles}>
                            <div style={{display: 'none'}} id={`${id}_reference_component`}/>
                            {!noPlaceholder && this.renderCloseMenuEditButton()}
                            {this.renderEnhancement()}
                            <Component
                                {...componentProps}
                                openEnhancement={(a, b) => this.openEnhancement(a, b)}
                                updateBody={(a) => this.updateBody(a)}
                                ReferenceComponent={hasReferenceComponent ? {
                                    getComponent: (params) => {
                                        const {submitEdit, textarea, selectId} = params;
                                        return (
                                            <ParamGenerator
                                                ref={this.paramGenerator}
                                                selectId={selectId}
                                                connection={connection}
                                                connector={connector}
                                                method={method}
                                                readOnly={readOnly}
                                                addParam={(a) => this.updateBody(a)}
                                                isVisible={true}
                                                submitEdit={submitEdit}
                                                id={`${id}_reference_component`}
                                                isAbsolute={CRequestType.isAbsolute()}
                                                parent={CRequestType.getParent(textarea)}
                                                hasArrowIcon={true}
                                                updateConnection={updateEntity}
                                            />
                                        );},
                                    id: `${id}_reference_component`,
                                    self: this.paramGenerator,
                                } : null}
                                onReferenceClick={hasReferenceComponent ? typeof openEnhancement === 'function' ? openEnhancement : (a, b) => this.openEnhancement(a, b) : null}
                            />
                            {
                                !readOnly && CRequestType.hasImport()
                                ?
                                    <React.Fragment>
                                        <TooltipFontIcon
                                            style={{ cursor: 'pointer'}}
                                            value={'keyboard'}
                                            onClick={() => this.toggleImportJson()}
                                            tooltip={'Type the whole JSON'}
                                        />
                                        {this.renderDialogImportJson()}
                                    </React.Fragment>
                                :
                                    null
                            }
                        </ToolboxThemeInput>
                    );
                }
            }
        )
    };
}
