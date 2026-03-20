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

import CXmlEditor from '@app_component/base/input/xml_view/xml_editor/classes/CXmlEditor';
import ReferenceGenerator from '@app_component/operator_builder/reference_generator/ReferenceGenerator';
import { isJsonString, isNumber, isString, subArrayToString } from "@application/utils/utils";
import { markFieldNameAsArray } from "@change_component//form_elements/form_connection/form_methods/help";
import Enhancement from "@change_component/form_elements/form_connection/form_methods/mapping/enhancement/Enhancement";
import Pointer from "@change_component/form_elements/form_connection/form_methods/method/Pointer";
import WebhookElement from "@change_component/form_elements/form_connection/form_methods/method/WebhookElement";
import Webhook from '@entity/connection/classes/Webhook';
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import CRequest from "@entity/connection/components/classes/components/content/invoker/request/CRequest";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import Input from "@entity/connection/components/components/general/basic_components/inputs/Input";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import styles from '@entity/connection/components/themes/default/general/form_methods.scss';
import React from 'react';
import { transformDataFields } from '../components/general/change_component/form_elements/form_connection/form_svg/utils';
import ToolboxThemeInput from "../hocs/ToolboxThemeInput";

export function RequestBody(CRequestType){
    return function (Component) {
        return class C extends React.Component {
            constructor(props) {
                super(props);
                this.paramGenerator = React.createRef();
                this.refStructure = null;

                this.state = {
                    showImportJson: false,
                    isBodyEditOpened: false,
                    importJsonBody: JSON.stringify(
                        props.method.request instanceof CRequest
                            ? props.target === 'header'
                                ? props.method.request.getHeaderFields()
                                : props.method.request.getBodyFields()
                            : {}
                    ),
                    showEnhancement: false,
                    currentEnhancement: null,
                };

                this.handleToggleEnhancement = this.toggleEnhancement.bind(this);
                this.handleOpenBodyEdit = this.openBodyEdit.bind(this);
                this.handleCloseBodyEdit = this.closeBodyEdit.bind(this);
                this.handleToggleImportJson = this.toggleImportJson.bind(this);
                this.handleImportJson = this.importJson.bind(this);
                this.handleUpdateEnhancement = this.updateEnhancement.bind(this);
                this.handleToggleImportJsonDialog = this.toggleImportJson.bind(this);
            }

            toggleEnhancement() {
                this.setState((prevState) => ({
                    showEnhancement: !prevState.showEnhancement,
                }));
            }

            openBodyEdit() {
                const { connector, method, updateEntity } = this.props;
                connector.setCurrentItem(method);
                updateEntity();
                this.setState({ isBodyEditOpened: true });
            }

            closeBodyEdit() {
                this.setState({ isBodyEditOpened: false });
            }

            toggleImportJson() {
                this.setState((prevState) => ({
                    showImportJson: !prevState.showImportJson,
                }));
            }

            onChangeImportJsonBody(importJsonBody) {
                this.setState({
                    importJsonBody,
                });
            }

            importJson() {
                let { importJsonBody } = this.state;
                if (isJsonString(importJsonBody)) {
                    this.updateData({ updated_src: JSON.parse(importJsonBody) });
                    this.toggleImportJson();
                } else {
                    alert('Not JSON format');
                }
            }

            getCurrentBindingItem(fieldName) {
                const { connection, method } = this.props;
                return connection.fieldBinding.find((item) => {
                    return (
                        item.to.findIndex((elem) => {
                            let name = elem.field.replace('[]', '');
                            return elem.color === method.color && name === fieldName;
                        }) !== -1
                    );
                });
            }

            openEnhancement(e, value) {
                const { connection } = this.props;
                let fieldName = '';
                if (value.namespace.length > 1) {
                    for (let i = 1; i < value.namespace.length; i++) {
                        if (
                            i + 1 < value.namespace.length &&
                            isNumber(value.namespace[i + 1])
                        ) {
                            fieldName += markFieldNameAsArray(
                                value.namespace[i],
                                value.namespace[i + 1]
                            );
                            i++;
                        } else {
                            fieldName += value.namespace[i];
                        }
                        fieldName += '.';
                    }
                }
                fieldName += value.variable.name;
                let bindingItem = this.getCurrentBindingItem(fieldName);
                if (bindingItem) {
                    bindingItem = bindingItem.to[0];
                    this.props.connection.setCurrentFieldBindingTo(bindingItem);
                }
                this.setState((prevState) => ({
                    currentEnhancement: connection.getEnhancementByTo(),
                    showEnhancement: !prevState.showEnhancement,
                }));
            }

            setCurrentEnhancement(currentEnhancement) {
                this.setState({
                    currentEnhancement,
                });
            }

            updateEnhancement() {
                const { currentEnhancement } = this.state;
                const { connection, updateEntity } = this.props;
                connection.updateEnhancement(currentEnhancement);
                updateEntity();
                this.toggleEnhancement();
            }

            updateData(data) {
                const {
                    connection,
                    connector,
                    method,
                    updateEntity,
                    target,
                } = this.props;
                connector.setCurrentItem(method);
                const regex = /^#[A-Fa-f0-9]{6}\.\((?:response|request)\)\.(header|body|status)/;
                const newValue = typeof data?.new_value === 'string' ? data.new_value : '';
                const match = newValue.match(regex);
                const apiDataType = match?.[1];
                const transformedData = data instanceof CXmlEditor
                    ? data
                    : {
                        ...data,
                        new_value: transformDataFields(data.new_value, apiDataType),
                        updated_src: transformDataFields(data.updated_src, apiDataType),
                    };

                const fieldBindingData = CRequestType.convertForFieldBinding(transformedData)

                CRequestType.updateFieldsBinding(
                    connection,
                    connector,
                    method,
                    fieldBindingData,
                    target,
                    this.refStructure
                );

                if (target === 'header') {
                    method.setRequestHeaderFields(
                        CRequestType.convertToBodyFormat(transformedData)
                    );
                } else {
                    method.setRequestBodyFields(
                        CRequestType.convertToBodyFormat(transformedData)
                    );
                }

                updateEntity();
            }

            getEnhancementData() {
                const { currentEnhancement } = this.state;
                const { readOnly, connection, method } = this.props;

                if (!(connection instanceof CConnection)) {
                    return null;
                }
                let bindingItem = connection.fieldBinding.find(
                    (item) =>
                        item.to.findIndex((elem) => elem.color === method.color) !== -1
                );
                if (!bindingItem) {
                    return null;
                }
                bindingItem = bindingItem.getObject();
                bindingItem.enhancement = null;
                return {
                    binding: bindingItem,
                    setEnhancement: (a) => this.setCurrentEnhancement(a),
                    readOnly,
                    enhancement: currentEnhancement,
                };
            }

            getEnhancementComponent() {
                const data = this.getEnhancementData();
                if (!data) {
                    return null;
                }
                return (
                    <div>
                        <Enhancement {...data} />
                    </div>
                );
            }

            renderEnhancement() {
                const { showEnhancement } = this.state;
                const { noPlaceholder } = this.props;
                return (
                    <Dialog
                        actions={[
                            {
                                label: 'Ok',
                                onClick: this.handleUpdateEnhancement,
                                id: 'body_ok',
                            },
                            {
                                label: 'Cancel',
                                onClick: this.handleToggleEnhancement,
                                id: 'body_cancel',
                            },
                        ]}
                        active={showEnhancement && !noPlaceholder}
                        toggle={this.handleToggleEnhancement}
                        title={'Enhancement'}
                        theme={{ dialog: styles.enhancement_dialog }}
                    >
                        {this.getEnhancementComponent()}
                    </Dialog>
                );
            }

            renderDialogImportJson() {
                let { showImportJson, importJsonBody } = this.state;
                importJsonBody = !isString(importJsonBody)
                    ? JSON.stringify(importJsonBody)
                    : importJsonBody;
                return (
                    <Dialog
                        actions={[
                            { label: 'Ok', onClick: this.handleImportJson },
                            { label: 'Cancel', onClick: this.handleToggleImportJsonDialog },
                        ]}
                        active={showImportJson}
                        toggle={this.handleToggleImportJsonDialog}
                        title={'Import Json'}
                        theme={{ dialog: styles.enhancement_dialog }}
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

            renderPlaceholder() {
                const { method } = this.props;
                let hasError = false;
                if (method.error && method.error.hasError) {
                    if (method.error.location === 'body') {
                        hasError = true;
                    }
                }
                return (
                    <React.Fragment>
                        <TooltipFontIcon
                            isButton={true}
                            className={styles.method_body_placeholder}
                            tooltip={'more details'}
                            value={<span>{CRequestType.getPlaceholder()}</span>}
                            style={hasError ? { color: 'red' } : {}}
                            onClick={this.handleOpenBodyEdit}
                        />
                    </React.Fragment>
                );
            }

            renderCloseMenuEditButton() {
                return (
                    <TooltipFontIcon
                        size={16}
                        isButton={true}
                        className={styles.body_close_menu_edit}
                        value={'check_circle_outline'}
                        tooltip={'Apply'}
                        onClick={this.handleCloseBodyEdit}
                    />
                );
            }

            getPointerComponent(id, connection) {
                return {
                    getComponent: (params) => {
                        return <Pointer {...params} connection={connection} />;
                    },
                    id: `${id}_pointer_component`,
                };
            }

            getWebhookComponent(connection) {
                return {
                    getComponent: (params) => {
                        const webhook = new Webhook(params.webhook);
                        return (
                            <WebhookElement
                                {...params}
                                webhook={webhook}
                                connection={connection}
                            />
                        );
                    },
                };
            }

            getReferenceComponent(id, connection, connector, method, readOnly, updateEntity, target) {
                return {
                    getComponent: (params) => {
                        const {
                            submitEdit,
                            textarea,
                            selectId,
                            editCancel,
                        } = params;

                        const connectionEditor = {
                            connection,
                            connector,
                            item: method,
                            updateConnection: updateEntity,
                        };

                        return (
                            <ReferenceGenerator
                                ref={this.paramGenerator}
                                connectionEditor={connectionEditor}
                                id={`${id}_reference_component`}
                                setReference={(a) => this.updateData(a)}
                                reference=''
                                parent={CRequestType.getParent(textarea)}
                                isAbsolute={CRequestType.isAbsolute()}
                                manualAdd={true}
                                actionButtonTooltip='Add Reference'
                                actionButtonValue='add'
                                submitEdit={submitEdit}
                                editCancel={editCancel}
                                bodyReference={target === 'body'}
                                headerReference={target === 'header'}
                                onNamespacesChange={(structure) => {
                                    this.refStructure = structure;
                                }}
                            />
                        );
                    },
                    id: `${id}_reference_component`,
                    self: this.paramGenerator,
                };
            }

            getOnReferenceClick(hasReferenceComponent, openEnhancement) {
                if (!hasReferenceComponent) {
                    return null;
                }

                if (typeof openEnhancement === 'function') {
                    return openEnhancement;
                }

                return (a, b) => this.openEnhancement(a, b);
            }

            render() {
                const { isBodyEditOpened } = this.state;
                const { requestBodyClassName, ...componentProps } = this.props;
                const {
                    id,
                    readOnly,
                    method,
                    connector,
                    connection,
                    bodyStyles,
                    isDraft,
                    noPlaceholder,
                    openEnhancement,
                    updateEntity,
                    isFullHeight,
                    target,
                } = this.props;

                if (!isBodyEditOpened && !noPlaceholder) {
                    return this.renderPlaceholder();
                }

                let ownBodyStyles = { left: '-20px' };
                const hasReferenceComponent = true;

                if (bodyStyles) {
                    ownBodyStyles = bodyStyles;
                }

                const className = `${
                    requestBodyClassName ? `${requestBodyClassName} ` : ''
                }${
                    styles[
                        CRequestType.getClassName({
                            isDraft,
                            noPlaceholder,
                            isFullHeight,
                        })
                    ]
                }`;

                const pointerComponent = this.getPointerComponent(id, connection);
                const webhookComponent = this.getWebhookComponent(connection);
                const referenceComponent = hasReferenceComponent
                    ? this.getReferenceComponent(
                        id,
                        connection,
                        connector,
                        method,
                        readOnly,
                        updateEntity,
                        target
                    )
                    : null;

                const onReferenceClick = this.getOnReferenceClick(
                    hasReferenceComponent,
                    openEnhancement
                );

                return (
                    <ToolboxThemeInput
                        className={className}
                        style={ownBodyStyles}
                    >
                        <div
                            style={{ display: 'none' }}
                            id={`${id}_reference_component`}
                        />

                        {!noPlaceholder && this.renderCloseMenuEditButton()}

                        {this.renderEnhancement()}

                        <Component
                            {...componentProps}
                            openEnhancement={(a, b) => this.openEnhancement(a, b)}
                            updateBody={(a) => this.updateData(a)}
                            PointerComponent={pointerComponent}
                            WebhookComponent={webhookComponent}
                            ReferenceComponent={referenceComponent}
                            onReferenceClick={onReferenceClick}
                        />

                        {!readOnly && CRequestType.hasImport() ? (
                            <React.Fragment>
                                <TooltipFontIcon
                                    style={{ cursor: 'pointer' }}
                                    value={'keyboard'}
                                    onClick={this.handleToggleImportJson}
                                    tooltip={'Type the whole JSON'}
                                />
                                {this.renderDialogImportJson()}
                            </React.Fragment>
                        ) : null}
                    </ToolboxThemeInput>
                );
            }
        };
    };
}