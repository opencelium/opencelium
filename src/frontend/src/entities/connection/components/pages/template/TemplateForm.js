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

import React from "react";
import {INPUTS} from "@entity/connection/components/utils/constants/inputs";
import {CONNECTION_VIEW_TYPE} from "@entity/connection/components/utils/constants/app";
import Form from "@change_component/Form";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import {EXPERT_MODE, TEMPLATE_MODE} from "@entity/connection/components/classes/components/content/connection/CTemplate";
import styles from '@entity/connection/components/themes/default/content/connections/change.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {CONNECTOR_FROM} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import {LocalStorage} from "@application/classes/LocalStorage";
import {capitalize, setFocusById} from "@application/utils/utils";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {AddNewConnectionButton} from "@entity/connection/components/pages/template/AddNewConnectionButton";
import ContentLoading from "@app_component/base/loading/ContentLoading";


/**
 * common component to update Template
 */
export function TemplateForm(type) {
    return function (Component) {
        return class extends Component {
            constructor(props) {
                super(props);

                this.redirectUrl = '/templates';
                this.translationKey = type.toUpperCase();
                this.isUpdate = type === 'update';
                this.isAdd = type === 'add';
                this.isView = type === 'view';
                this.actionName = this.isUpdate ? `updatingTemplate` : `addingTemplate`;
                this.state = {
                    hasModeInputsSection: this.isUpdate,
                    hasMethodsInputsSection: this.isUpdate,
                    validationMessages: {
                        title: '',
                        fromConnector: '',
                        toConnector: '',
                        template: '',
                    },
                    connection: CConnection.createConnection(null),
                    entity: null,
                    mode: EXPERT_MODE,
                    isDataUploaded: false,
                };
                this.isNavigatingToScheduler = false;
                this.startCheckingName = false;
                this.startAction = false;
                this.isFetchedConnection = false;
            }

            componentDidMount(){
                let { params, fetchTemplate, fetchConnectors } = this.props;
                if(params){
                    fetchTemplate(params.id);
                }
                if(fetchConnectors){
                    fetchConnectors();
                }
                setFocusById('input_title');
            }

            componentDidUpdate(prevProps, prevState, snapshot) {
                const {checkingTemplateName, checkTitleResult, t, navigate, error, fetchingTemplate, fetchingConnectors} = this.props;
                this.checkValidationRequest('title', checkingTemplateName === API_REQUEST_STATE.FINISH, checkTitleResult === TRIPLET_STATE.FALSE, t(`${this.translationKey}.VALIDATION_MESSAGES.TITLE_EXIST`));
                if(this.props[this.actionName] === API_REQUEST_STATE.FINISH && this.startAction){
                    this.startAction = false;
                    navigate(this.redirectUrl, { replace: false });
                }
                if(!this.state.isDataUploaded && fetchingTemplate === API_REQUEST_STATE.FINISH && fetchingConnectors === API_REQUEST_STATE.FINISH){
                    let connectionData = this.props.template ? {...this.props.template.connection, ...this.getConnectionConnectors(), title: this.props.template.name, description: this.props.template.description, error} : null;
                    this.setState({
                        connection: CConnection.createConnection(connectionData),
                        isDataUploaded: true,
                    })
                }
            }

            setMode(mode, callback = null){
                this.setState({mode}, callback);
            }

            /**
             * to clear validation message by name
             */
            clearValidationMessage(name){
                this.setValidationMessage(name, '');
            }

            checkValidationRequest(propertyName, propertyWasChecked, checkingResult, validationMessage){
                if(this.startDoingAction && this.startCheckingName && propertyWasChecked){
                    this.startCheckingName = false;
                    if(checkingResult) {
                        this.setState({
                            validationMessages: {
                                ...this.state.validationMessages,
                                [propertyName]: validationMessage
                            }
                        });
                        setFocusById(`input_${propertyName}`)
                        this.startDoingAction = false;
                    } else{
                        let isFreeToDoAction = true;
                        for(let param in this.state.validationMessages){
                            if(this.state.validationMessages[param] !== ''){
                                setFocusById(`input_${param}`);
                                isFreeToDoAction = false;
                                break;
                            }
                        }
                        if(isFreeToDoAction){
                            this.doAction(this.state.entity);
                        }
                        this.startDoingAction = false;
                    }
                }
            }

            setValidationMessage(name, value){
                if(this.state.validationMessages.hasOwnProperty(name)) {
                    this.setState({
                        validationMessages: {
                            ...this.state.validationMessages,
                            [name]: value,
                        }
                    })
                }
            }

            /**
             * to redirect app after adding/updating Template
             */
            redirect(){
                this.props.navigate(this.redirectUrl, { replace: false });
            }

            getConnectionConnectors(){
                const {template, connectors} = this.props;
                let fromConnectorSource = connectors ? connectors.find(c => c.connectorId === template.connection.fromConnector.connectorId) : null;
                let toConnectorSource = connectors ? connectors.find(c => c.connectorId === template.connection.toConnector.connectorId) : null;
                let fromConnectorInvoker = fromConnectorSource ? fromConnectorSource.invoker : null;
                let toConnectorInvoker = toConnectorSource ? toConnectorSource.invoker : null;
                let fromConnector = {...template.connection.fromConnector};
                let toConnector = {...template.connection.toConnector};
                if(fromConnectorInvoker){
                    fromConnector.invoker = fromConnectorInvoker;
                }
                if(toConnectorInvoker){
                    toConnector.invoker = toConnectorInvoker;
                }
                return{
                    fromConnector,
                    toConnector,
                }
            }

            getConnection(){
                const {error, template, connectors} = this.props;
                let connection;
                if((this.isUpdate || this.isView) && template){
                    connection = CConnection.createConnection({...template.connection, ...this.getConnectionConnectors(), title: template.name, description: template.description, error});
                } else{
                    connection = this.state.connection;
                    connection.setError(error);
                }
                return connection;
            }

            /**
             * to get items for connector menu
             */
            getConnectorMenuItems(){
                const {connectors} = this.props;
                let result = [];
                if(connectors) {
                    connectors.map(connector => {
                        result.push({label: connector.title, value: connector.connectorId});
                    });
                }
                return result;
            }

            getFirstConnectorFormSection(){
                const {validationMessages} = this.state;
                const {t, connectors} = this.props;
                let connectorMenuItems = this.getConnectorMenuItems();
                return {
                    ...INPUTS.CONNECTOR,
                    error: {fromConnector: validationMessages.fromConnector, toConnector: validationMessages.toConnector},
                    label: t(`${this.translationKey}.FORM.CONNECTORS`),
                    placeholders: [t(`${this.translationKey}.FORM.CONNECTORS_PLACEHOLDER_1`), t(`${this.translationKey}.FORM.CONNECTORS_PLACEHOLDER_2`)],
                    required: true,
                    source: connectorMenuItems,
                    callback: (a, b) => this.setMethods(a, b),
                    connectors,
                };
            }

            getMethodsFormSection(){
                const {t, connectors} = this.props;
                return {
                    ...INPUTS.CONNECTION_SVG,
                    label: t(`${this.translationKey}.FORM.METHODS`),
                    templateLabels: {addTemplate: t(`${this.translationKey}.FORM.ADD_TEMPLATE`), addTemplateTitle: t(`${this.translationKey}.FORM.ADD_TEMPLATE_TITLE`)},
                    actions: {addTemplate: (a) => this.addTemplate(a)},
                    source: Object.freeze(connectors),
                    readOnly: this.isView,
                };
            }

            /**
             * to set methods state
             */
            setMethods(value, connectorType){
                if(value !== '' && connectorType) {
                    const {connection} = this.state;
                    let connectorValidationMessage = {};
                    if(connectorType === CONNECTOR_FROM){
                        connectorValidationMessage.fromConnector = '';
                    } else{
                        connectorValidationMessage.toConnector = '';
                    }
                    let fromConnectorId = connection.fromConnector.id;
                    let toConnectorId = connection.toConnector.id;
                    if(connection.template.mode === TEMPLATE_MODE){
                        this.props.fetchTemplates({from: fromConnectorId, to: toConnectorId});
                    }
                    this.setState({
                        hasModeInputsSection: fromConnectorId !== 0 && toConnectorId !== 0,
                        hasMethodsInputsSection: fromConnectorId !== 0 && toConnectorId !== 0,
                        validationMessages:{
                            ...this.state.validationMessages,
                            template: '',
                            ...connectorValidationMessage,
                        },
                        mode: EXPERT_MODE,
                    });
                }
            }

            /**
             * to validate name
             */
            validateName(entity){
                const {t, template, checkTemplateName, checkNameResult} = this.props;
                if(entity.name.trim() === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.TITLE_REQUIRED`)};
                } else{
                    if(!this.isUpdate || (this.isUpdate && template.name !== entity.title)) {
                        if(!(this.state.entity && entity.title === this.state.entity.title && checkNameResult === TRIPLET_STATE.TRUE)) {
                            this.startCheckingName = true;
                            checkTemplateName(entity);
                            return {value: false, message: ''};
                        }
                    }
                }
                return {value: true, message: ''};
            }

            /**
             * to validate from connector
             */
            validateFromConnector(entity){
                const {t} = this.props;
                if(entity.fromConnector.id === 0){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.FROM_CONNECTOR_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate to connector
             */
            validateToConnector(entity){
                const {t} = this.props;
                if(entity.toConnector.id === 0){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.TO_CONNECTOR_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate template
             */
            validateTemplate(entity){
                const {t} = this.props;
                if (entity.template && entity.template.mode === TEMPLATE_MODE && entity.template.templateId === -1) {
                    if(entity.allTemplates.length === 0){
                        return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.NO_TEMPLATES`)};
                    } else{
                        return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.TEMPLATE_REQUIRED`)};
                    }
                }
                return {value: true, message: ''};
            }

            /**
             * to add template
             */
            addTemplate(template){
                const {addTemplate} = this.props;
                addTemplate({version: template.version, name: template.name, description: template.description, connection: template.entity.getObject()});
            }

            getSecondThirdFormsSections(){
                const {hasModeInputsSection, validationMessages, hasMethodsInputsSection, mode} = this.state;
                const {t, connectors} = this.props;
                let connectorMenuItems = this.getConnectorMenuItems();
                let result = [];
                const secondFormSection = {
                    inputs: [
                        {
                            ...INPUTS.CONNECTOR_READONLY,
                            label: t(`${this.translationKey}.FORM.CONNECTORS`),
                            placeholders: [t(`${this.translationKey}.FORM.CHOSEN_CONNECTOR_FROM`), t(`${this.translationKey}.FORM.CHOSEN_CONNECTOR_TO`)],
                            source: connectorMenuItems,
                            connectors,
                            hasApiDocs: true,
                            readOnly: true,
                            style: {margin: '0 65px'},
                        },{
                            ...INPUTS.MODE,
                            error: validationMessages.template,
                            label: t(`${this.translationKey}.FORM.MODE`),
                            confirmationLabels:{title: t(`${this.translationKey}.CONFIRMATION.TITLE`), message: t(`${this.translationKey}.CONFIRMATION.MESSAGE`)},
                            modeLabels: {expert: t(`${this.translationKey}.FORM.EXPERT_MODE`), template: t(`${this.translationKey}.FORM.TEMPLATE_MODE`)},
                            required: true,
                            readOnly: false,
                            connectors: connectors,
                            mode,
                            setMode: (a, b = null) => this.setMode(a, b),
                        },
                    ],
                    hint: {text: t(`${this.translationKey}.FORM.HINT_2`)},
                    header: t(`${this.translationKey}.FORM.PAGE_2`),
                    visible: hasModeInputsSection || this.isView,
                };
                if(!this.isView){
                    result.push(secondFormSection);
                }
                const thirdFormSection = {
                    inputs: [
                        {
                            ...INPUTS.CONNECTOR_READONLY,
                            label: t(`${this.translationKey}.FORM.CONNECTORS`),
                            placeholders: [t(`${this.translationKey}.FORM.CHOSEN_CONNECTOR_FROM`), t(`${this.translationKey}.FORM.CHOSEN_CONNECTOR_TO`)],
                            source: connectorMenuItems,
                            readOnly: true,
                            hasAddMethod: true,
                            style: {margin: '0 65px'},
                            connectors,
                        },
                        this.getMethodsFormSection(),
                    ],
                    formClassName: styles.methods_form,
                    hint: {text: t(`${this.translationKey}.FORM.HINT_3`)},
                    header: t(`${this.translationKey}.FORM.PAGE_3`),
                    visible: hasMethodsInputsSection || this.isView,
                }
                result.push(thirdFormSection);
                return result;
            }

            do(entity){
                const {validationMessages} = this.state;
                this.startDoingAction = true;
                let validationNames = Object.keys(validationMessages);
                let isValidationPassed = true;
                let validations = {};
                let firstValidationName = '';
                for(let i = 0; i < validationNames.length; i++){
                    if(typeof this[`validate${capitalize(validationNames[i])}`] === 'function') {
                        const result = this[`validate${capitalize(validationNames[i])}`](entity);
                        if (!result.value) {
                            validations[validationNames[i]] = result.message;
                            if (isValidationPassed) {
                                isValidationPassed = false;
                                firstValidationName = validationNames[i];
                            }
                        } else {
                            validations[validationNames[i]] = '';
                        }
                    }
                }
                if(isValidationPassed){
                    this.action(entity);
                    this.startDoingAction = false;
                } else{
                    const convertedObject = typeof entity.getObjectForBackend === 'function' ? entity.getObjectForBackend() : typeof entity.getObject === 'function' ? entity.getObject() : entity;
                    this.setState({
                        validationMessages: {...validationMessages, ...validations},
                        entity: Object.assign({}, convertedObject),
                    });
                    if(firstValidationName !== ''){
                        if(validations[firstValidationName] !== '') {
                            setFocusById(`input_${firstValidationName}`);
                        }
                    }
                }
            }

            action(entity){
                const {updateTemplate, template} = this.props;
                this.startAction = true;

                const convertedObject = {...template, name: entity.title, description: entity.description, connection: typeof entity.getObjectForBackend === 'function' ? entity.getObjectForBackend() : entity};
                if(this.isUpdate){
                   // updateTemplate(convertedObject);
                }
            }
            /**
             * to add/update Connection
             */
            doAction(entity, redirectUrl, isNavigatingToScheduler = false){
                this.isNavigatingToScheduler = isNavigatingToScheduler;
                const storage = LocalStorage.getStorage();
                storage.remove(`${entity.fromConnector.invoker.name}&${entity.toConnector.invoker.name}`);
                this.do(entity)
                if(redirectUrl)
                    this.redirectUrl = redirectUrl;
            }

            doActionAndGoToAddScheduler(entity){
                this.doAction(entity, '/schedules/add', true);
            }

            doActionAndGoToScheduler(entity){
                this.doAction(entity, '/schedules', true);
            }

            render(){
                const {validationMessages, connection, isDataUploaded} = this.state;
                const {t, error, checkingTemplateName} = this.props;
                if(!isDataUploaded){
                    return <ContentLoading/>;
                }
                let contentTranslations = {};
                contentTranslations.header = [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'Update Template'}];
                if(this.isView){
                    contentTranslations.list_button = {title: t(`connections:VIEW.LIST_BUTTON`), link: this.redirectUrl};
                } else{
                    contentTranslations.cancel_button = {title: t(`app:FORM.CANCEL`), link: this.redirectUrl};
                }
                contentTranslations.action_button = this.isView ? null : {title: t(`${this.translationKey}.${this.translationKey}_BUTTON`), link: this.redirectUrl};
                let contents = [
                    {
                        inputs: [
                            {
                                ...INPUTS.CONNECTION_TITLE,
                                error: validationMessages.title,
                                label: t(`${this.translationKey}.FORM.TITLE`),
                                maxLength: 256,
                                required: true,
                                readOnly: this.isView,
                            },
                            {...INPUTS.DESCRIPTION,
                                label: t(`${this.translationKey}.FORM.DESCRIPTION`),
                                readOnly: this.isView,
                            },
                            this.getFirstConnectorFormSection(),
                        ],
                        formClassName: this.isView ? styles.direction_form : '',
                        hint: {text: t(`${this.translationKey}.FORM.HINT_1`)},
                        header: t(`${this.translationKey}.FORM.PAGE_1`),
                    },
                    ...this.getSecondThirdFormsSections(),
                ];
                const additionalButtons = (entity) => {
                    if(this.isView || contents.length < 2){
                        return null;
                    }
                    return(
                        <AddNewConnectionButton connection={entity}/>
                    );
                }
                return (
                    <Form
                        contents={contents}
                        translations={contentTranslations}
                        isActionInProcess={!this.isNavigatingToScheduler && (this.props[this.actionName] === API_REQUEST_STATE.START || checkingTemplateName === API_REQUEST_STATE.START)}
                        permissions={ConnectionPermissions}
                        clearValidationMessage={(a) => this.clearValidationMessage(a)}
                        action={(a) => this.doAction(a)}
                        entity={connection}
                        type={type}
                        additionalButtons={additionalButtons}
                    />
                );
            }
        }
    }
}