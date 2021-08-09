import {capitalize, isString, setFocusById} from "@utils/app";
import {AuthenticationTypes, DefaultAuthenticationType} from "@components/content/connectors/AuthenticationTypes";
import {CONNECTOR_TOURS} from "@utils/constants/tours";
import i18n from "@utils/i18n";
import {INPUTS} from "@utils/constants/inputs";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Form from "@change_component/Form";
import {ConnectorPermissions} from "@utils/constants/permissions";
import OCTour from "@basic_components/OCTour";
import React from "react";

/**
 * common component to add and update Connector
 */
export function ConnectorChange(type) {
    return function (Component) {
        return class extends Component {
            constructor(props) {
                super(props);

                this.connectorPrefixUrl = '/connectors';
                this.translationKey = type.toUpperCase();
                this.isUpdate = type === 'update';
                this.actionName = this.isUpdate ? `updatingConnector` : `addingConnector`;
                this.state = {
                    authenticationFields: {},
                    hasAuthenticationInputsSection: this.isUpdate ? props.entity && !!props.entity.invoker : false,
                    validationMessages: {
                        title: '',
                        invoker: '',
                    },
                    entity: null,
                };
                this.startTesting = false;
            }

            componentDidMount(){
                const {connector, invokers} = this.props;
                let {authenticationFields} = this.state;
                if(invokers.length > 0) {
                    let invokerName = connector && connector.invoker.name;
                    let invoker = invokers.find(invoker => invoker.name === invokerName);
                    for (let i = 0; i < invokers.length; i++) {
                        for(let j = 0; j < invokers[i].requiredData.length; j++){
                            if(invoker && invoker.requiredData.indexOf(invokers[i].requiredData[j]) !== -1 && invokerName === invokers[i].name) {
                                authenticationFields[invokers[i].name + '__' + invokers[i].requiredData[j]] = true;
                            } else{
                                authenticationFields[invokers[i].name + '__' + invokers[i].requiredData[j]] = false;
                            }
                        }
                    }
                    this.setState({
                        authenticationFields
                    });
                }
                setFocusById('input_title');
            }

            componentDidUpdate(prevProps, prevState, snapshot) {
                const {t, testResult, checkingConnectorTitle, checkTitleResult, checkValidationRequest} = this.props;
                checkValidationRequest(this, 'title', checkingConnectorTitle, checkTitleResult, t(`${this.translationKey}.VALIDATION_MESSAGES.TITLE_EXIST`));
                if(this.startTesting && testResult){
                    const fields = {};
                    if(testResult.status > 299 || testResult.status < 200){
                        for(let param in this.state.authenticationFields){
                            if(this.state.authenticationFields[param]){
                                fields[param] = t(`${this.translationKey}.VALIDATION_MESSAGES.WRONG_CREDENTIAL_DATA`);
                            }
                        }
                        this.setState({
                            validationMessages: {...this.state.validationMessages, ...fields}
                        })
                    } else{
                        this.setState({
                            validationMessages: {title: '', invoker: ''},
                        }, () => ::this.props.doAction({...this.state.entity, ...this.state.authenticationFields}, this))

                    }
                    this.startTesting = false;
                }
            }

            /**
             * to clear validation message by name
             */
            clearValidationMessage(name){
                const {setValidationMessage} = this.props;
                setValidationMessage(this, name, '');
            }

            /**
             * to parse connector before add/update
             */
            parseBeforeTest(connector){
                const {authenticationFields} = this.state;
                let data = {};
                data['id'] = parseInt(this.props.params.id);
                data['title'] = connector.title;
                data['icon'] = connector.icon;
                data['description'] = connector.description;
                data['invoker'] = {name: connector.invoker.hasOwnProperty('value') ? connector.invoker.value : connector.invoker};
                data['requestData'] = {};
                for(let field in authenticationFields){
                    if(authenticationFields[field]){
                        let delimiterPos = field.indexOf('__');
                        let fieldName = field.substring(delimiterPos + 2);
                        data['requestData'][fieldName] = connector[field];
                    }
                }
                return data;
            }

            /**
             * to redirect app after add/update
             */
            redirect(){
                if(this.isUpdate) {
                    this.props.router.push(`${this.connectorPrefixUrl}/${this.props.params.id}/view`);
                } else{
                    this.props.router.push(`${this.connectorPrefixUrl}`);
                }
            }

            /**
             * to map invokers for select
             */
            mapInvokers(){
                const {invokers, t} = this.props;
                let result = {invokers: [], descriptions: []};
                result.invokers.push({label: t(`${this.translationKey}.FORM.INVOKER_PLACEHOLDER`), value: 0});
                result.descriptions[0] = t(`${this.translationKey}.FORM.INVOKER_DESCRIPTION_DEFAULT`);
                invokers.map(invoker => {
                    result.invokers.push({label: invoker.name, value: invoker.name});
                    result.descriptions[invoker.name] = invoker.hint;
                });
                return result;
            }

            /**
             * to parse connector after fetch
             */
            parseEntity(){
                if(this.isUpdate) {
                    const {connector, params} = this.props;
                    let result = {};
                    if (connector) {
                        result.id = params.id;
                        result.title = connector.name;
                        result.description = connector.description;
                        result.invoker = connector.invoker.name;
                        for (let i = 0; i < connector.invoker.requiredData.length; i++) {
                            result[connector.invoker.name + '__' + connector.invoker.requiredData[i]] = connector.requestData[connector.invoker.requiredData[i]];
                        }
                    }
                    return result;
                }
                return null;
            }

            /**
             * to choose invoker by invoker name to update authenticationFields state
             */
            chooseInvoker(invokerName){
                const {invokers} = this.props;
                invokerName = isString(invokerName) ? invokerName : invokerName.hasOwnProperty('value') ? invokerName.value : '';
                if(invokers && invokerName !== '') {
                    let invoker = invokers.find(invoker => invoker.name === invokerName);
                    if (invoker && invoker.hasOwnProperty('requiredData')) {
                        if (invoker.requiredData.length > 0) {
                            let authenticationFields = this.state.authenticationFields;
                            for (let field in authenticationFields) {
                                let delimiterPos = field.indexOf('__');
                                let tmpInvokerName = field.substring(0, delimiterPos);
                                let fieldName = field.substring(delimiterPos + 2);
                                if (invoker.requiredData.indexOf(fieldName) !== -1 && invokerName === tmpInvokerName) {
                                    authenticationFields[field] = true;
                                } else {
                                    authenticationFields[field] = false;
                                }
                            }
                            this.setState({
                                authenticationFields,
                                hasAuthenticationInputsSection: true,
                            });
                        }
                    }
                } else{
                    this.setState({
                        hasAuthenticationInputsSection: false,
                    });
                }
            }

            /**
             * to generate Authentication Inputs
             */
            generateAuthenticationInputs(){
                const {authenticationFields, validationMessages} = this.state;
                const {t, invokers} = this.props;
                let result = [];
                let tourIndex = -1;
                for(let i = 0; i < invokers.length; i++){
                    for(let j = 0; j < invokers[i].requiredData.length; j++){
                        let field = {};
                        const fieldName = invokers[i].requiredData[j];
                        const invokerName = invokers[i].name;
                        if(AuthenticationTypes.hasOwnProperty(fieldName.toLowerCase())){
                            field = Object.assign({}, AuthenticationTypes[fieldName.toLowerCase()]);
                        } else{
                            field = Object.assign({}, DefaultAuthenticationType);
                        }
                        field.name = invokerName + '__' + fieldName;
                        tourIndex = CONNECTOR_TOURS.page_2.findIndex(s => s.key === field.key);
                        if(tourIndex !== -1) {
                            field.tourStep = CONNECTOR_TOURS.page_2[tourIndex].selector;
                        }
                        field.label = i18n.exists(`${this.translationKey}.FORM.${fieldName.toUpperCase()}`) ? t(`${this.translationKey}.FORM.${fieldName.toUpperCase()}`) : capitalize(fieldName);
                        field.visible = authenticationFields[invokerName + '__' + fieldName];
                        field.required = authenticationFields[invokerName + '__' + fieldName];
                        field.error = validationMessages.hasOwnProperty(invokerName + '__' + fieldName) ? validationMessages[invokerName + '__' + fieldName] : '';
                        result.push(field);
                    }
                }
                return result;
            }

            /**
             * to validate title on exist
             */
            validateTitle(entity){
                const {t, checkTitleResult, connector, checkConnectorTitle} = this.props;
                if(entity.title.trim() === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.TITLE_REQUIRED`)};
                } else{
                    if(!this.isUpdate || (this.isUpdate && connector.name !== entity.title)) {
                        if (!(this.state.entity && entity.title === this.state.entity.title && checkTitleResult && checkTitleResult.message === 'NOT_EXISTS')) {
                            checkConnectorTitle(entity);
                            return {value: false, message: ''};
                        }
                    }
                }
                return {value: true, message: ''};
            }
            /**
             * to validate title
             */
            validateInvoker(entity){
                const {t} = this.props;
                if(entity.invoker === 0){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.INVOKER_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to test connection
             */
            testAuthenticationInputs(connector){
                this.setState({
                    entity: connector,
                }, () => {
                    this.startTesting = true;
                    const {testConnector} = this.props;
                    let data = this.parseBeforeTest(connector);
                    testConnector(data);
                });
            }

            /**
             * to add/update connector
             */
            doAction(connector){
                const {doAction, params} = this.props;
                const {authenticationFields} = this.state;
                const data = {...connector, authenticationFields};
                if(this.isUpdate){
                    data.id = parseInt(params.id);
                }
                doAction(data, this);
            }

            render(){
                const {hasAuthenticationInputsSection, validationMessages} = this.state;
                const {t, openTour, closeTour, isTourOpen, testingConnector, checkingConnectorTitle} = this.props;
                let {invokers, descriptions} = this.mapInvokers();
                let parsedEntity = this.parseEntity();
                let contentTranslations = {};
                contentTranslations.header = {title: t(`${this.translationKey}.HEADER`), onHelpClick: openTour};
                contentTranslations.list_button = {title: t(`${this.translationKey}.LIST_BUTTON`), link: this.connectorPrefixUrl};
                contentTranslations.action_button = {title: t(`${this.translationKey}.${this.translationKey}_BUTTON`), link: this.connectorPrefixUrl};
                let authenticationInputs = this.generateAuthenticationInputs();
                let contents = [{
                    inputs: [
                        {...INPUTS.TITLE,
                            error: validationMessages.title,
                            tourStep: CONNECTOR_TOURS.page_1[0].selector,
                            label: t(`${this.translationKey}.FORM.TITLE`),
                            required: true,
                            maxLength: 128,
                            isLoading: checkingConnectorTitle === API_REQUEST_STATE.START,
                        },
                        {...INPUTS.DESCRIPTION,
                            label: t(`${this.translationKey}.FORM.DESCRIPTION`)
                        },
                        {...INPUTS.INVOKER,
                            error: validationMessages.invoker,
                            tourStep: CONNECTOR_TOURS.page_1[1].selector,
                            label: t(`${this.translationKey}.FORM.INVOKER`),
                            required: true,
                            source: invokers,
                            description: {name: 'description', label: t(`${this.translationKey}.FORM.INVOKER_DESCRIPTION`), values: descriptions},
                            callback: ::this.chooseInvoker,
                            defaultValue: 0,
                        },
                        {...INPUTS.ICON,
                            label: t(`${this.translationKey}.FORM.ICON`),
                            browseTitle: t(`${this.translationKey}.FORM.ICON_PLACEHOLDER`),
                        },
                    ],
                    hint: {text: t(`${this.translationKey}.FORM.HINT_1`), openTour},
                    header: t(`${this.translationKey}.FORM.PAGE_1`),
                },{
                    inputs: [...authenticationInputs, {...INPUTS.TEST_BUTTON, test: ::this.testAuthenticationInputs, disabled: testingConnector === API_REQUEST_STATE.START}],
                    hint: {text: t(`${this.translationKey}.FORM.HINT_2`), openTour},
                    header: t(`${this.translationKey}.FORM.PAGE_2`),
                    visible: hasAuthenticationInputsSection,
                },
                ];
                return (
                    <div>
                        <Form
                            contents={contents}
                            translations={contentTranslations}
                            isActionInProcess={this.props[this.actionName] === API_REQUEST_STATE.START || this.startTesting && testingConnector === API_REQUEST_STATE.START || checkingConnectorTitle === API_REQUEST_STATE.START}
                            permissions={ConnectorPermissions}
                            clearValidationMessage={::this.clearValidationMessage}
                            action={::this.doAction}
                            entity={parsedEntity}
                            type={type}
                        />
                        <OCTour
                            steps={CONNECTOR_TOURS.page_1}
                            isOpen={isTourOpen}
                            onRequestClose={closeTour}
                        />
                    </div>
                );
            }
        }
    }
}