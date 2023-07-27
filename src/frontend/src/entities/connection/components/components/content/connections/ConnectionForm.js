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

import React from "react";
import {INPUTS} from "@entity/connection/components/utils/constants/inputs";
import Form from "@change_component/Form";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import {EXPERT_MODE, TEMPLATE_MODE} from "@entity/connection/components/classes/components/content/connection/CTemplate";
import styles from '@entity/connection/components/themes/default/content/connections/change.scss';
import {
    CONNECTOR_FROM,
    CONNECTOR_TO
} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import AddTemplate from "@change_component/form_elements/form_connection/form_methods/AddTemplate";
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";
import {LocalStorage} from "@application/classes/LocalStorage";
import {capitalize, findTopLeft, setFocusById} from "@application/utils/utils";
import {TextSize} from "@app_component/base/text/interfaces";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";

import "@style/css/react_resizable.css";
import "@style/css/graphiql.css";
import ContentLoading from "@app_component/base/loading/ContentLoading";
import {ConnectionPermissions} from "@root/constants";
import {IF_OPERATOR} from "@classes/content/connection/operator/COperatorItem";
import LoadTemplate from "@change_component/form_elements/form_connection/form_methods/LoadTemplate";

/**
 * common component to add and update Connection
 */
export function ConnectionForm(type) {
    return function (Component) {
        return class extends Component {
            constructor(props) {
                super(props);
                this.type = type;
                this.redirectUrl = '/connections';
                this.translationKey = this.type.toUpperCase();
                this.isUpdate = this.type === 'update';
                this.isAdd = this.type === 'add';
                this.isView = this.type === 'view';
                this.actionName = this.isUpdate ? `updatingConnection` : `addingConnection`;
                this.state = {
                    runTest: false,
                    justUpdate: false,
                    hasModeInputsSection: this.isUpdate,
                    hasMethodsInputsSection: this.isUpdate,
                    validationMessages: {
                        title: '',
                        fromConnector: '',
                        toConnector: '',
                        template: '',
                    },
                    validateLogicResult: {toggleFlag: false, operators: {[CONNECTOR_FROM]: [], [CONNECTOR_TO]: []}},
                    connection: CConnection.createConnection(),
                    entity: null,
                    mode: EXPERT_MODE,
                };
                this.isNavigatingToScheduler = false;
                this.startCheckingTitle = false;
                this.startAction = false;
                this.isFetchedConnection = false;
            }

            componentDidMount(){
                let { params } = this.props;
                if(params){
                    this.props.fetchConnection(params.id);
                }
                if(this.props.fetchConnectors){
                    this.props.fetchConnectors();
                }
                setFocusById('input_title');
            }

            componentDidUpdate(prevProps, prevState, snapshot) {
                const {checkingConnectionTitle, checkTitleResult, t, navigate, error} = this.props;
                this.checkValidationRequest('title', checkingConnectionTitle === API_REQUEST_STATE.FINISH, checkTitleResult === TRIPLET_STATE.FALSE, t(`${this.translationKey}.VALIDATION_MESSAGES.TITLE_EXIST`));
                if(this.props[this.actionName] === API_REQUEST_STATE.FINISH && this.startAction){
                    this.startAction = false;
                    if(this.state.justUpdate){
                        if(this.state.runTest){
                            this.setState({justUpdate: false, runTest: false});
                            this.props.testConnection(this.props.connection);
                        } else{
                            this.setState({justUpdate: false});
                        }
                    } else{
                        if(this.redirectUrl){
                            navigate(this.redirectUrl, { replace: false });
                        }
                    }
                }
                if((this.props.fetchingConnection && prevProps.fetchingConnection === API_REQUEST_STATE.START && this.props.fetchingConnection === API_REQUEST_STATE.FINISH)
                || (prevProps.connection === null && this.props.connection !== null)){
                    this.isFetchedConnection = true;
                    if(!this.isView) {
                        this.type = 'update';
                        this.translationKey = this.type.toUpperCase();
                        this.isUpdate = this.type === 'update';
                        this.isAdd = this.type === 'add';
                        this.isView = this.type === 'view';
                    }
                    this.setState({
                        connection: CConnection.createConnection({...this.props.connection, error}),
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
                if(this.startDoingAction && this.startCheckingTitle && propertyWasChecked){
                    this.startCheckingTitle = false;
                    if(checkingResult) {
                        this.setState({
                            validationMessages: {
                                ...this.state.validationMessages,
                                [propertyName]: validationMessage
                            },
                            runTest: false,
                            justUpdate: false,
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
                            if(this.isNavigatingToScheduler){
                                this.doAction(this.state.entity, this.redirectUrl, true);
                            } else{
                                this.doAction(this.state.entity);
                            }
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
             * to redirect app after adding/updating Connection
             */
            redirect(){
                this.props.navigate(this.redirectUrl, { replace: false });
            }

            getConnection(){
                const {error} = this.props;
                let connection;
                if((this.isUpdate || this.isView) && this.props.connection){
                    connection = CConnection.createConnection({...this.props.connection, error});
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
                if(this.isUpdate || this.isView){
                    return {
                        ...INPUTS.CONNECTOR_READONLY,
                        label: t('UPDATE.FORM.CONNECTORS'),
                        placeholders: [t('UPDATE.FORM.CHOSEN_CONNECTOR_FROM'), t('UPDATE.FORM.CHOSEN_CONNECTOR_TO')],
                        source: connectorMenuItems,
                        connectors,
                        readOnly: true,
                    };
                }
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
                    errors: this.state.validateLogicResult,
                    justUpdate: (entity) => this.justUpdate(entity),
                    testConnection: (entity) => this.testConnection(entity)
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
             * to validate title
             */
            validateTitle(entity){
                const {t, connection, checkConnectionTitle, checkTitleResult} = this.props;
                const specialCharacters = /[\/\\]/;
                if(entity.title.trim() === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.TITLE_REQUIRED`)};
                } else if(specialCharacters.test(entity.title)) {
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.TITLE_CONTAINER_SPEC_CHAR`)};
                } else{
                    if(!this.isUpdate || (this.isUpdate && connection.title !== entity.title)) {
                        if(!(this.state.entity && entity.title === this.state.entity.title && checkTitleResult === TRIPLET_STATE.TRUE)) {
                            this.startCheckingTitle = true;
                            checkConnectionTitle(entity);
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
             * to validate methods and operators
             */
            validateLogic(entity) {
                const fromConnectorOperators = entity.fromConnector.operators;
                const toConnectorOperators = entity.toConnector.operators;
                const errors = {operators: {[CONNECTOR_FROM]: [], [CONNECTOR_TO]: []}};
                const checkOperator = (connector, connectorType) => {
                    connector.forEach((operator) => {
                        const condition = operator.condition;
                        let operatorErrors = [];
                        if(!condition.leftStatement || !condition.leftStatement.color || !condition.leftStatement.field){
                            operatorErrors.push('Left Statement is missing');
                        }
                        if(operator.type === IF_OPERATOR && !condition.relationalOperator){
                            operatorErrors.push('Relational Operator is missing');
                        }
                        if(operatorErrors.length > 0){
                            errors.operators[connectorType].push({
                                index: operator.index,
                                errors: operatorErrors,
                            })
                        }
                    })
                }
                checkOperator(fromConnectorOperators, CONNECTOR_FROM);
                checkOperator(toConnectorOperators, CONNECTOR_TO);
                const hasErrors = errors.operators[CONNECTOR_FROM].length > 0 || errors.operators[CONNECTOR_TO].length > 0;
                return {passed: !hasErrors, result: errors};
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
                    formClassName: styles.mode_form,
                    hint: {text: t(`${this.translationKey}.FORM.HINT_2`)},
                    header: t(`${this.translationKey}.FORM.PAGE_2`),
                    visible: (hasModeInputsSection || this.isView) && !this.isUpdate,
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

            justUpdate(entity){
                this.setState({
                    justUpdate: true,
                })
                this.do(entity)
                this.redirectUrl = '';
            }

            testConnection(entity){
                this.setState({
                    runTest: true,
                })
                this.do(entity)
                this.redirectUrl = '';
            }

            do(entity){
                const {validationMessages} = this.state;
                this.redirectUrl = '/connections';
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
                const logicValidation = this.validateLogic(entity);
                isValidationPassed = isValidationPassed && logicValidation.passed;
                if(isValidationPassed){
                    this.action(entity);
                    this.startDoingAction = false;
                } else{
                    const convertedObject = typeof entity.getObjectForBackend === 'function' ? entity.getObjectForBackend() : typeof entity.getObject === 'function' ? entity.getObject() : entity;
                    const allValidations = {...validationMessages, ...validations};
                    let hasErrorMessage = false;
                    for(let param in allValidations){
                        if(allValidations[param] !== ''){
                            hasErrorMessage = true;
                        }
                    }
                    let newState = {
                        validationMessages: allValidations,
                        entity: Object.assign({}, convertedObject),
                        validateLogicResult: {toggleFlag: !this.state.validateLogicResult.toggleFlag, ...logicValidation.result},
                    }
                    if(hasErrorMessage){
                        newState.runTest = false;
                        newState.justUpdate = false;
                    }
                    this.setState(newState);
                    if(firstValidationName !== ''){
                        if(validations[firstValidationName] !== '') {
                            setFocusById(`input_${firstValidationName}`);
                        }
                    }
                }
            }

            action(entity){
                this.startAction = true;
                if(this.isUpdate){
                    this.props.updateConnection(typeof entity.getObjectForBackend === 'function' ? entity.getObjectForBackend() : entity);
                }
                if(this.isAdd){
                    this.props.addConnection(typeof entity.getObjectForBackend === 'function' ? entity.getObjectForBackend() : entity);
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
                const {validationMessages, connection} = this.state;
                const {t, error, checkingConnectionTitle, fetchingConnectors} = this.props;
                if((!this.isView && fetchingConnectors !== API_REQUEST_STATE.FINISH) || (!this.isAdd && !this.isFetchedConnection)){
                    return <ContentLoading/>;
                }
                let contentTranslations = {};

                contentTranslations.header = t(`${this.translationKey}.HEADER`);
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
                        visible: this.isAdd || this.isView,
                    },
                    ...this.getSecondThirdFormsSections(),
                ];
                const additionalButtons = (entity, updateEntity) => {
                    if(this.isView || contents.length < 2){
                        return null;
                    }
                    let button = null;
                    if(this.isAdd){
                        button = <Button icon={'add'} isLoading={this.isNavigatingToScheduler && (this.props[this.actionName] === API_REQUEST_STATE.START || checkingConnectionTitle === API_REQUEST_STATE.START)} title={t('ADD.ADD_BUTTON_AND_GO_TO_ADD_SCHEDULER')} onClick={() => this.doActionAndGoToAddScheduler(entity)} size={TextSize.Size_16}/>;
                    }
                    if(this.isUpdate){
                        button = <Button icon={'autorenew'} isLoading={this.isNavigatingToScheduler && (this.props[this.actionName] === API_REQUEST_STATE.START || checkingConnectionTitle === API_REQUEST_STATE.START)} title={t('UPDATE.UPDATE_BUTTON_AND_GO_TO_SCHEDULER')} onClick={() => this.doActionAndGoToScheduler(entity)} size={TextSize.Size_16}/>;
                    }
                    const isDisabled = entity.fromConnector.methods.length === 0 && entity.fromConnector.operators.length === 0
                                        && entity.toConnector.methods.length === 0 && entity.toConnector.operators.length === 0;
                    return(
                        <React.Fragment>
                            {button}
                            <div style={{float: 'left'}}>
                                <AddTemplate
                                    data={contents[2].inputs[1]}
                                    entity={entity}
                                    disabled={isDisabled}
                                    buttonProps={{
                                        size: TextSize.Size_16,
                                        icon: 'add',
                                        title: t(`${this.translationKey}.FORM.ADD_TEMPLATE`)
                                    }}
                                />
                            </div>
                            {this.isUpdate &&
                                <div style={{float: 'left'}}>
                                    <LoadTemplate
                                        data={contents[1].inputs[1]}
                                        entity={entity}
                                        updateEntity={updateEntity}
                                    />
                                </div>
                            }
                            <Button
                                key={'list_button'}
                                label={'Cancel'}
                                icon={'cancel'}
                                href={'/connections'}
                                size={TextSize.Size_16}
                            />
                        </React.Fragment>
                    );
                }
                return (
                    <Form
                        shouldScroll={this.isUpdate ? 'Methods' : ''}
                        contents={contents}
                        translations={contentTranslations}
                        isActionInProcess={!this.isNavigatingToScheduler && (this.props[this.actionName] === API_REQUEST_STATE.START || checkingConnectionTitle === API_REQUEST_STATE.START)}
                        permissions={ConnectionPermissions}
                        clearValidationMessage={(a) => this.clearValidationMessage(a)}
                        action={(a) => this.doAction(a)}
                        entity={connection}
                        type={this.type}
                        additionalButtons={additionalButtons}
                    />
                );
            }
        }
    }
}
