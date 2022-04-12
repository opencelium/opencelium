/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React from "react";
import {INPUTS} from "@utils/constants/inputs";
import {CONNECTION_VIEW_TYPE} from "@utils/constants/app";
import Form from "@change_component/Form";
import {ConnectionPermissions} from "@utils/constants/permissions";
import CConnection from "@classes/components/content/connection/CConnection";
import {EXPERT_MODE, TEMPLATE_MODE} from "@classes/components/content/connection/CTemplate";
import styles from '@themes/default/content/connections/change.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import AddTemplate from "@change_component/form_elements/form_connection/form_methods/AddTemplate";
import Button from "@basic_components/buttons/Button";
import {LocalStorage} from "@class/application/LocalStorage";
import {capitalize, setFocusById} from "@utils/app";
import {TextSize} from "@atom/text/interfaces";
import ContentLoading from "@molecule/loading/ContentLoading";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@interface/application/IApplication";


/**
 * common component to add and update Connection
 */
export function ConnectionForm(type) {
    return function (Component) {
        return class extends Component {
            constructor(props) {
                super(props);

                this.redirectUrl = '/connections';
                this.translationKey = type.toUpperCase();
                this.isUpdate = type === 'update';
                this.isAdd = type === 'add';
                this.isView = type === 'view';
                this.actionName = this.isUpdate ? `updatingConnection` : `addingConnection`;
                this.state = {
                    hasModeInputsSection: this.isUpdate,
                    hasMethodsInputsSection: this.isUpdate,
                    validationMessages: {
                        title: '',
                        fromConnector: '',
                        toConnector: '',
                        template: '',
                    },
                    connection: CConnection.createConnection(),
                    entity: null,
                    isNewConnectionView: props.connectionViewType === CONNECTION_VIEW_TYPE.DIAGRAM,
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
                    navigate(this.redirectUrl, { replace: false });
                }
                if(this.props.fetchingConnection && prevProps.fetchingConnection === API_REQUEST_STATE.START && this.props.fetchingConnection === API_REQUEST_STATE.FINISH){
                    this.isFetchedConnection = true;
                    this.setState({
                        connection: CConnection.createConnection({...this.props.connection, error}),
                    })
                }
            }

            setMode(mode, callback = null){
                this.setState({mode}, callback);
            }

            toggleIsNewConnectionView(){
                this.props.setConnectionViewType(!this.state.isNewConnectionView ? CONNECTION_VIEW_TYPE.DIAGRAM : CONNECTION_VIEW_TYPE.COLUMN)
                this.setState({
                    isNewConnectionView: !this.state.isNewConnectionView,
                }, () => {const elem = document.getElementById('form_section_header_methods'); if(elem) elem.scrollIntoView();})
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
                const {isNewConnectionView} = this.state;
                const {t, connectors} = this.props;
                const inputs = isNewConnectionView ? {...INPUTS.CONNECTION_SVG} : {...INPUTS.METHODS};
                return {
                    ...inputs,
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
             * to validate title
             */
            validateTitle(entity){
                const {t, connection, checkConnectionTitle, checkTitleResult} = this.props;
                if(entity.title.trim() === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.TITLE_REQUIRED`)};
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
             * to add template
             */
            addTemplate(template){
                const {addTemplate} = this.props;
                addTemplate({version: template.version, name: template.name, description: template.description, connection: template.entity.getObject()});
            }

            getSecondThirdFormsSections(){
                const {hasModeInputsSection, validationMessages, hasMethodsInputsSection, isNewConnectionView, mode} = this.state;
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
                        },
                        this.getMethodsFormSection(),
                    ],
                    formClassName: styles.methods_form,
                    hint: {text: t(`${this.translationKey}.FORM.HINT_3`)},
                    header: t(`${this.translationKey}.FORM.PAGE_3`),
                    visible: hasMethodsInputsSection || this.isView,
                    hasFullScreenFunction: true,
                    AdditionalIcon: <TooltipFontIcon whiteTheme size={20} tooltipPosition={'bottom'} isButton className={styles.switch_view_icon} value={isNewConnectionView ? 'align_vertical_top' : 'account_tree'} tooltip={isNewConnectionView ? 'Column View' : 'Diagram View'} onClick={() => this.toggleIsNewConnectionView()}/>
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
                    },
                    ...this.getSecondThirdFormsSections(),
                ];
                const additionalButtons = (entity) => {
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
                                /></div>
                        </React.Fragment>
                    );
                }
                return (
                    <Form
                        contents={contents}
                        translations={contentTranslations}
                        isActionInProcess={!this.isNavigatingToScheduler && (this.props[this.actionName] === API_REQUEST_STATE.START || checkingConnectionTitle === API_REQUEST_STATE.START)}
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