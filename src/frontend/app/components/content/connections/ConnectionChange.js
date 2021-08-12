import React from "react";
import {setFocusById} from "@utils/app";
import {CONNECTION_TOURS} from "@utils/constants/tours";
import {INPUTS} from "@utils/constants/inputs";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Form from "@change_component/Form";
import {ConnectionPermissions} from "@utils/constants/permissions";
import OCTour from "@basic_components/OCTour";
import CConnection from "@classes/components/content/connection/CConnection";
import {TEMPLATE_MODE} from "@classes/components/content/connection/CTemplate";
import {removeLS} from "@utils/LocalStorage";
import styles from '@themes/default/content/connections/change.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

/**
 * common component to add and update Connector
 */
export function ConnectionChange(type) {
    return function (Component) {
        return class extends Component {
            constructor(props) {
                super(props);

                this.connectionPrefixUrl = '/connections';
                this.translationKey = type.toUpperCase();
                this.isUpdate = type === 'update';
                this.actionName = this.isUpdate ? `updatingConnection` : `addingConnection`;
                this.state = {
                    hasModeInputsSection: this.isUpdate,
                    hasMethodsInputsSection: this.isUpdate,
                    validationMessages: {
                        title: '',
                        fromConnector: '',
                        mode: '',
                    },
                    connection: CConnection.createConnection(null),
                    entity: null,
                    isNewConnectionView: true,
                };
            }

            componentDidMount(){
                setFocusById('input_title');
            }

            componentDidUpdate(prevProps, prevState, snapshot) {
                const {checkingConnectionTitle, checkTitleResult, t, checkValidationRequest} = this.props;
                checkValidationRequest(this, 'title', checkingConnectionTitle, checkTitleResult, t(`${this.translationKey}.VALIDATION_MESSAGES.TITLE_EXIST`));
            }

            toggleIsNewConnectionView(){
                this.setState({
                    isNewConnectionView: !this.state.isNewConnectionView,
                }, () => document.getElementById('form_section_header_methods').scrollIntoView())
            }

            /**
             * to clear validation message by name
             */
            clearValidationMessage(name){
                const {setValidationMessage} = this.props;
                setValidationMessage(this, name, '');
            }

            /**
             * to redirect app after adding/updating Connection
             */
            redirect(){
                this.props.router.push(`${this.connectionPrefixUrl}`);
            }

            getConnection(){
                const {error} = this.props;
                let connection;
                if(this.isUpdate){
                    connection = this.props.connection;
                    connection.error = error;
                    connection = CConnection.createConnection(connection);
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
                connectors.map(connector => {
                    result.push({label: connector.name, value: connector.id});
                });
                return result;
            }

            getFirstConnectorFormSection(){
                const {validationMessages} = this.state;
                const {t, connectors} = this.props;
                let connectorMenuItems = this.getConnectorMenuItems();
                if(this.isUpdate){
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
                    error: validationMessages.fromConnector,
                    tourStep: CONNECTION_TOURS.page_1[1].selector,
                    label: t(`${this.translationKey}.FORM.CONNECTORS`),
                    placeholders: [t(`${this.translationKey}.FORM.CONNECTORS_PLACEHOLDER_1`), t(`${this.translationKey}.FORM.CONNECTORS_PLACEHOLDER_2`)],
                    required: true,
                    source: connectorMenuItems,
                    callback: ::this.setMethods,
                    connectors,
                };
            }

            getMethodsFormSection(){
                const {isNewConnectionView} = this.state;
                const {t, connectors} = this.props;
                const inputs = isNewConnectionView ? {...INPUTS.CONNECTION_SVG} : {...INPUTS.METHODS};
                return {
                    ...inputs,
                    tourSteps: CONNECTION_TOURS.page_3,
                    label: t(`${this.translationKey}.FORM.METHODS`),
                    templateLabels: {addTemplate: t(`${this.translationKey}.FORM.ADD_TEMPLATE`), addTemplateTitle: t(`${this.translationKey}.FORM.ADD_TEMPLATE_TITLE`)},
                    actions: {addTemplate: ::this.addTemplate},
                    source: Object.freeze(connectors),
                    readOnly: false,
                };
            }

            /**
             * to set methods state
             */
            setMethods(value, connectorType){
                if(value !== '' && connectorType) {
                    this.setState({
                        hasModeInputsSection: this.state.connection.fromConnector.id !== 0 &&  this.state.connection.toConnector.id !== 0,
                        hasMethodsInputsSection: this.state.connection.fromConnector.id !== 0 &&  this.state.connection.toConnector.id !== 0,
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
                        if(!(this.state.entity && entity.title === this.state.entity.title && checkTitleResult && checkTitleResult.message === 'NOT_EXISTS')) {
                            checkConnectionTitle(entity);
                            return {value: false, message: ''};
                        }
                    }
                }
                return {value: true, message: ''};
            }

            /**
             * to validate connector
             */
            validateFromConnector(entity){
                const {t} = this.props;
                if(entity.fromConnector.id === 0){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.FROM_CONNECTOR_REQUIRED`)};
                }
                if(entity.toConnector.id === 0){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.TO_CONNECTOR_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate mode
             */
            validateMode(entity){
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

            /**
             * to add/update Connection
             */
            doAction(entity){
                const {authUser, doAction} = this.props;
                removeLS(`${entity.fromConnector.invoker.name}&${entity.toConnector.invoker.name}`, `connection_${authUser.userId}`);
                doAction(entity.getObject(), this);
            }

            render(){
                const {validationMessages, hasModeInputsSection, hasMethodsInputsSection, isNewConnectionView} = this.state;
                const {t, connectors, checkingConnectionTitle, openTour, closeTour, isTourOpen} = this.props;
                const connection = this.getConnection();
                let connectorMenuItems = this.getConnectorMenuItems();
                let contentTranslations = {};
                contentTranslations.header = {title: t(`${this.translationKey}.HEADER`), onHelpClick: openTour};
                contentTranslations.list_button = {title: t(`${this.translationKey}.LIST_BUTTON`), link: this.connectionPrefixUrl};
                contentTranslations.action_button = {title: t(`${this.translationKey}.${this.translationKey}_BUTTON`), link: this.connectionPrefixUrl};
                let contents = [{
                    inputs: [
                        {
                            ...INPUTS.CONNECTION_TITLE,
                            error: validationMessages.title,
                            tourStep: CONNECTION_TOURS.page_1[0].selector,
                            label: t(`${this.translationKey}.FORM.TITLE`),
                            maxLength: 256,
                            required: true,
                        },
                        {...INPUTS.DESCRIPTION,
                            label: t(`${this.translationKey}.FORM.DESCRIPTION`)
                        },
                        this.getFirstConnectorFormSection(),
                    ],
                    hint: {text: t(`${this.translationKey}.FORM.HINT_1`), openTour},
                    header: t(`${this.translationKey}.FORM.PAGE_1`),
                },{
                    inputs: [
                        {
                            ...INPUTS.CONNECTOR_READONLY,
                            label: t(`${this.translationKey}.FORM.CONNECTORS`),
                            placeholders: [t(`${this.translationKey}.FORM.CHOSEN_CONNECTOR_FROM`), t(`${this.translationKey}.FORM.CHOSEN_CONNECTOR_TO`)],
                            source: connectorMenuItems,
                            connectors,
                            readOnly: true,
                            style: {margin: '0 65px'},
                        },{
                            ...INPUTS.MODE,
                            error: validationMessages.mode,
                            tourStep: CONNECTION_TOURS.page_2[0].selector,
                            label: t(`${this.translationKey}.FORM.MODE`),
                            confirmationLabels:{title: t(`${this.translationKey}.CONFIRMATION.TITLE`), message: t(`${this.translationKey}.CONFIRMATION.MESSAGE`)},
                            modeLabels: {expert: t(`${this.translationKey}.FORM.EXPERT_MODE`), template: t(`${this.translationKey}.FORM.TEMPLATE_MODE`)},
                            required: true,
                            readOnly: false,
                            connectors: connectors,
                        },
                    ],
                    hint: {text: t(`${this.translationKey}.FORM.HINT_2`), openTour},
                    header: t(`${this.translationKey}.FORM.PAGE_2`),
                    visible: hasModeInputsSection,
                },{
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
                    hint: {text: t(`${this.translationKey}.FORM.HINT_3`), openTour},
                    header: t(`${this.translationKey}.FORM.PAGE_3`),
                    visible: hasMethodsInputsSection,
                    hasFullScreenFunction: true,
                    AdditionalIcon: <TooltipFontIcon isButton className={styles.switch_view_icon} value={isNewConnectionView ? 'align_vertical_top' : 'account_tree'} tooltip={isNewConnectionView ? 'Column View' : 'Diagram View'} onClick={::this.toggleIsNewConnectionView}/>
                    /*
                    * TODO: uncomment when backend will be ready
                    */
                    // extraAction: 'CHECK_CONNECTION',
                },
                ];
                return (
                    <div>
                        <Form
                            contents={contents}
                            translations={contentTranslations}
                            isActionInProcess={this.props[this.actionName] === API_REQUEST_STATE.START || checkingConnectionTitle === API_REQUEST_STATE.START}
                            permissions={ConnectionPermissions}
                            clearValidationMessage={::this.clearValidationMessage}
                            action={::this.doAction}
                            entity={connection}
                            type={type}
                        />
                        <OCTour
                            steps={ConnectionPermissions.page_1}
                            isOpen={isTourOpen}
                            onRequestClose={closeTour}
                        />
                    </div>
                );
            }
        }
    }
}