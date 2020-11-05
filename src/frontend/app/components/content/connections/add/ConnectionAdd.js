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

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import Content from "../../../general/content/Content";

import {checkConnectionTitle} from '@actions/connections/fetch';
import {addConnection} from '@actions/connections/add';
import {addTemplate} from "@actions/templates/add";
import {fetchConnectors} from '@actions/connectors/fetch';
import {ConnectionPermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {setFocusById} from "@utils/app";
import {INPUTS} from "@utils/constants/inputs";
import OCTour from "@basic_components/OCTour";
import {automaticallyShowTour, CONNECTION_ADD_TOURS} from "@utils/constants/tours";
import CConnection, {ALL_COLORS} from "@classes/components/content/connection/CConnection";
import ChangeContent from "@change_component/ChangeContent";
import {SingleComponent} from "@decorators/SingleComponent";
import {TEMPLATE_MODE} from "@classes/components/content/connection/CTemplate";
import {removeLS} from "@utils/LocalStorage";


const connectionPrefixURL = '/connections';

function mapStateToProps(state){
    const auth = state.get('auth');
    const connections = state.get('connections');
    const connectors = state.get('connectors');
    return{
        authUser: auth.get('authUser'),
        addingConnection: connections.get('addingConnection'),
        error: connections.get('error'),
        savingTemplate: connections.get('savingTemplate'),
        connectors: connectors.get('connectors').toJS(),
        fetchingConnectors: connectors.get('fetchingConnectors'),
        checkingConnectionTitle: connections.get('checkingConnectionTitle'),
        checkTitleResult: connections.get('checkTitleResult'),
        validatingFormMethods: connections.get('validatingFormMethods'),
        validateFormMethodsResult: connections.get('validateFormMethodsResult'),
    };
}

function mapConnection(connection){
    return connection.getObject();
}

/**
 * Component to Add Connection
 */
@connect(mapStateToProps, {addConnection, addTemplate, fetchConnectors, checkConnectionTitle})
@permission(ConnectionPermissions.CREATE, true)
@withTranslation(['connections', 'app', 'basic_components'])
@SingleComponent('connection', 'adding', ['connectors'], mapConnection)
class ConnectionAdd extends Component{

    constructor(props){
        super(props);
        const {authUser} = this.props;
        this.startCheckingTitle = false;
        this.state = {
            connection: CConnection.createConnection(null),
            currentTour: 'page_1',
            isTourOpen: automaticallyShowTour(authUser),
        };
    }

    componentDidMount(){
        setFocusById('input_connection_title');
    }

    /**
     * to set appropriate Tour
     */
    setCurrentTour(pageNumber){
        const {authUser} = this.props;
        this.startCheckingTitle = false;
        this.startValidatingFormMethods = false;
        this.setState({
            currentTour: `page_${pageNumber}`,
            isTourOpen: automaticallyShowTour(authUser),
        });
    }

    /**
     * to close current Tour
     */
    closeTour(){
        this.setState({
            isTourOpen: false,
        });
    }

    /**
     * to open current Tour
     */
    openTour(){
        this.setState({
           isTourOpen: true,
        });
    }

    /**
     * to redirect app after adding Connection
     */
    redirect(){
        this.props.router.push(`${connectionPrefixURL}`);
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

    /**
     * to set methods state
     */
    setMethods(value, connectorType){
        if(value !== '' && connectorType) {
            let {methods} = this.state;
            let {connectors} = this.props;
            let connector = connectors.find(c => c.id === value.value);
            if(connector) {
                let invokerName = connector.hasOwnProperty('invoker') ? connector.invoker.name : '';
                if (invokerName !== '') {
                    switch (connectorType) {
                        case 'fromConnector':
                            methods.connectorList[0].connectorId = value.value;
                            methods.connectorList[0].name = invokerName;
                            break;
                        case 'toConnector':
                            methods.connectorList[1].connectorId = value.value;
                            methods.connectorList[1].name = invokerName;
                            break;
                    }
                    this.setState({methods});
                }
            }
        }
    }

    /**
     * to validate title
     */
    validateTitle(connection){
        const {t} = this.props;
        if(connection.title === ''){
            setFocusById('input_connection_title');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.TITLE_REQUIRED')};
        } else {
            this.startCheckingTitle = true;
            this.props.checkConnectionTitle(connection.getObject());
            return {value: false, message: ''};
        }
    }

    /**
     * to validate connector
     */
    validateConnectors(connection){
        const {t} = this.props;
        if(connection.fromConnector.id === 0){
            setFocusById('from_connector');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.FROM_CONNECTOR_REQUIRED')};
        }
        if(connection.toConnector.id === 0){
            setFocusById('to_connector');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.TO_CONNECTOR_REQUIRED')};
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
                return {value: false, message: t('ADD.VALIDATION_MESSAGES.NO_TEMPLATES')};
            } else{
                setFocusById('templates');
                return {value: false, message: t('ADD.VALIDATION_MESSAGES.TEMPLATE_REQUIRED')};
            }
        }
        return {value: true, message: ''};
    }

    /**
     * to add template
     */
    addTemplate(template){
        const {addTemplate} = this.props;
        addTemplate({name: template.name, description: template.description, connection: template.entity.getObject()});
    }

    doAction(connection){
        const {authUser} = this.props;
        removeLS(`${connection.fromConnector.invoker.name}&${connection.toConnector.invoker.name}`, `connection_${authUser.userId}`);
        this.props.doAction(connection);
    }

    render(){
        const {
            t, connectors, authUser, checkingConnectionTitle, checkTitleResult,
            addingConnection, error,
        } = this.props;
        let {connection} = this.state;
        connection.setError(error);
        let connectorMenuItems = this.getConnectorMenuItems();
        let contentTranslations = {};
        contentTranslations.header = t('ADD.HEADER');
        contentTranslations.list_button = {title: t('ADD.LIST_BUTTON'), index: 2};
        let changeContentTranslations = {};
        changeContentTranslations.addButton = t('ADD.ADD_BUTTON');
        changeContentTranslations.testButton = t('ADD.TEST_BUTTON');
        let getListLink = `${connectionPrefixURL}`;
        let breadcrumbsItems = [t('ADD.FORM.PAGE_1'), t('ADD.FORM.PAGE_2'), t('ADD.FORM.PAGE_3')];
        let contents = [{
            inputs: [
                {
                    ...INPUTS.CONNECTION_TITLE,
                    tourStep: CONNECTION_ADD_TOURS.page_1[0].selector,
                    label: t('ADD.FORM.TITLE'),
                    maxLength: 256,
                    required: true,
                    check: (e, entity) => ::this.validateTitle(e, entity),
                    request: {
                        inProcess: checkingConnectionTitle,
                        status: this.startCheckingTitle && !checkingConnectionTitle,
                        result: checkTitleResult,
                        notSuccessMessage: t('ADD.FORM.TITLE_EXIST'),
                    }},
                {
                    ...INPUTS.CONNECTOR,
                    tourStep: CONNECTION_ADD_TOURS.page_1[1].selector,
                    label: t('ADD.FORM.CONNECTORS'),
                    placeholders: [t('ADD.FORM.CONNECTORS_PLACEHOLDER_1'), t('ADD.FORM.CONNECTORS_PLACEHOLDER_2')],
                    required: true,
                    source: connectorMenuItems,
                    callback: ::this.setMethods,
                    connectors,
                    check: (e, entity) => ::this.validateConnectors(e, entity),
                },
            ],
            hint: {text: t('ADD.FORM.HINT_1'), openTour: ::this.openTour},
        },{
            inputs: [
                {
                    ...INPUTS.CONNECTOR_READONLY,
                    label: t('ADD.FORM.CONNECTORS'),
                    placeholders: [t('ADD.FORM.CHOSEN_CONNECTOR_FROM'), t('ADD.FORM.CHOSEN_CONNECTOR_TO')],
                    source: connectorMenuItems,
                    connectors,
                    readOnly: true,
                },{
                    ...INPUTS.MODE,
                    tourStep: CONNECTION_ADD_TOURS.page_2[0].selector,
                    label: t('ADD.FORM.MODE'),
                    confirmationLabels:{title: t('ADD.CONFIRMATION.TITLE'), message: t('ADD.CONFIRMATION.MESSAGE')},
                    modeLabels: {expert: t('ADD.FORM.EXPERT_MODE'), template: t('ADD.FORM.TEMPLATE_MODE')},
                    required: true,
                    readOnly: false,
                    connectors: connectors,
                    check: (e, entity) => ::this.validateMode(e, entity),
                },
            ],
            hint: {text: t('ADD.FORM.HINT_2'), openTour: ::this.openTour},
        },{
            inputs: [
                {
                    ...INPUTS.CONNECTOR_READONLY,
                    label: t('ADD.FORM.CONNECTORS'),
                    placeholders: [t('ADD.FORM.CHOSEN_CONNECTOR_FROM'), t('ADD.FORM.CHOSEN_CONNECTOR_TO')],
                    source: connectorMenuItems,
                    readOnly: true,
                    hasAddMethod: true,
                },
                {
                    ...INPUTS.METHODS,
                    tourSteps: CONNECTION_ADD_TOURS.page_3,
                    label: t('ADD.FORM.METHODS'),
                    templateLabels: {addTemplate: t('ADD.FORM.ADD_TEMPLATE'), addTemplateTitle: t('ADD.FORM.ADD_TEMPLATE_TITLE')},
                    actions: {addTemplate: ::this.addTemplate},
                    source: Object.freeze(connectors),
                    readOnly: false,
                },
            ],
            hint: {text: t('ADD.FORM.HINT_3'), openTour: ::this.openTour},
            /*
            * TODO: uncomment when backend will be ready
            */
           // extraAction: 'CHECK_CONNECTION',
        },
        ];
        return (
            <Content translations={contentTranslations} getListLink={getListLink} permissions={ConnectionPermissions} authUser={authUser}>
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    action={::this.doAction}
                    entity={connection}
                    isActionInProcess={addingConnection}
                    authUser={authUser}
                    onPageSwitch={::this.setCurrentTour}
                />
                <OCTour
                    steps={CONNECTION_ADD_TOURS[this.state.currentTour]}
                    isOpen={this.state.isTourOpen}
                    onRequestClose={::this.closeTour}
                />
            </Content>
        );
    }
}

export default ConnectionAdd;