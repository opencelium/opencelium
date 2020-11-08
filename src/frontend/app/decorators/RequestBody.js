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

import React from 'react';
import {withTranslation} from 'react-i18next';
import {isJsonString, subArrayToString, isString} from "@utils/app";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import CConnection from "@classes/components/content/connection/CConnection";
import Dialog from "@basic_components/Dialog";
import Enhancement from "@change_component/form_elements/form_connection/form_methods/mapping/enhancement/Enhancement";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import ParamGenerator from "@change_component/form_elements/form_connection/form_methods/method/ParamGenerator";
import styles from '@themes/default/general/form_methods.scss';
import Input from "@basic_components/inputs/Input";
import CRequest from "@classes/components/content/invoker/request/CRequest";
import ToolboxThemeInput from "../hocs/ToolboxThemeInput";


export function RequestBody(CRequestType){
    return function (Component) {
        return (
            @withTranslation('basic_components')
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
                    const {connector} = this.props;
                    if(connector.getConnectorType() === CONNECTOR_FROM){
                        return;
                    }
                    let fieldName = '';
                    if(value.namespace.length > 1){
                        fieldName = `${subArrayToString(value.namespace, '.', 1, value.namespace.length)}.`;
                    }
                    fieldName += value.variable.name;
                    let bindingItem = this.getCurrentBindingItem(fieldName);
                    if(bindingItem){
                        bindingItem = bindingItem.to[0];
                        this.props.connection.setCurrentFieldBindingTo(bindingItem);
                    }
                    this.setState({
                        currentEnhancement: this.props.connection.getEnhancementByTo(),
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

                renderEnhancement(){
                    const {showEnhancement, currentEnhancement} = this.state;
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
                    return (
                        <Dialog
                            actions={[{label: 'Ok', onClick: ::this.updateEnhancement, id: 'body_ok'}, {label: 'Cancel', onClick: ::this.toggleEnhancement, id: 'body_cancel'}]}
                            active={showEnhancement}
                            toggle={::this.toggleEnhancement}
                            title={'Enhancement'}
                            theme={{dialog: styles.enhancement_dialog}}
                        >
                            <div>
                                <Enhancement
                                    binding={bindingItem}
                                    setEnhancement={::this.setCurrentEnhancement}
                                    readOnly={readOnly}
                                    enhancement={currentEnhancement}
                                />
                            </div>
                        </Dialog>
                    );
                }

                renderDialogImportJson(){
                    let {showImportJson, importJsonBody} = this.state;
                    importJsonBody = !isString(importJsonBody) ? JSON.stringify(importJsonBody) : importJsonBody;
                    return (
                        <Dialog
                            actions={[{label: 'Ok', onClick: ::this.importJson}, {label: 'Cancel', onClick: ::this.toggleImportJson}]}
                            active={showImportJson}
                            toggle={::this.toggleImportJson}
                            title={'Import Json'}
                            theme={{dialog: styles.enhancement_dialog}}
                        >
                            <Input
                                className={styles.textarea_import_json}
                                name={'json'}
                                type={'text'}
                                onChange={::this.onChangeImportJsonBody}
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
                                onClick={::this.openBodyEdit}/>
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
                            onClick={::this.closeBodyEdit}
                        />
                    );
                }

                render(){
                    const {isBodyEditOpened} = this.state;
                    const {id, readOnly, method, connector, connection, bodyStyles, isDraft} = this.props;
                    if(!isBodyEditOpened){
                        return this.renderPlaceholder();
                    }
                    let ownBodyStyles = {left: '-20px'};
                    let hasReferenceComponent = !(method.index === '0' && connector.getConnectorType() === CONNECTOR_FROM);
                    if(bodyStyles){
                        ownBodyStyles = bodyStyles;
                    }
                    return(
                        <ToolboxThemeInput className={styles[CRequestType.getClassName({isDraft})]} style={ownBodyStyles}>
                            <div style={{display: 'none'}} id={`${id}_reference_component`}/>
                            {::this.renderCloseMenuEditButton()}
                            {this.renderEnhancement()}
                            <Component
                                {...this.props}
                                updateBody={::this.updateBody}
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
                                                addParam={::this.updateBody}
                                                isVisible={true}
                                                submitEdit={submitEdit}
                                                id={`${id}_reference_component`}
                                                isAbsolute={CRequestType.isAbsolute()}
                                                parent={CRequestType.getParent(textarea)}
                                                hasArrowIcon={true}
                                            />
                                        );},
                                    id: `${id}_reference_component`,
                                    self: this.paramGenerator,
                                } : null}
                                onReferenceClick={hasReferenceComponent ? ::this.openEnhancement : null}
                            />
                            {
                                !readOnly && CRequestType.hasImport()
                                ?
                                    <React.Fragment>
                                        <TooltipFontIcon
                                            style={{ cursor: 'pointer'}}
                                            value={'keyboard'}
                                            onClick={::this.toggleImportJson}
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
