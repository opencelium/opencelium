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
import ChangeContent from "@change_component/ChangeContent";

import {checkConnectionTitle} from '@actions/connections/fetch';
import {fetchConnection} from "@actions/connections/fetch";
import {updateConnection} from "@actions/connections/update";
import {addTemplate} from "@actions/templates/add";
import {fetchConnectors} from '@actions/connectors/fetch';
import {ConnectionPermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {INPUTS} from "@utils/constants/inputs";
import OCTour from "@basic_components/OCTour";
import {automaticallyShowTour, CONNECTION_UPDATE_TOURS} from "@utils/constants/tours";
import {SingleComponent} from "@decorators/SingleComponent";
import CConnection from "@classes/components/content/connection/CConnection";
import {setFocusById} from "@utils/app";


const connectionPrefixURL = '/connections';

function mapStateToProps(state){
    const auth = state.get('auth');
    const connections = state.get('connections');
    const connectors = state.get('connectors');
    return{
        authUser: auth.get('authUser'),
        connection: connections.get('connection'),
        fetchingConnection: connections.get('fetchingConnection'),
        updatingConnection: connections.get('updatingConnection'),
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
 * Component to Update Connection
 */
@connect(mapStateToProps, {updateConnection, addTemplate, fetchConnection, fetchConnectors, checkConnectionTitle})
@permission(ConnectionPermissions.CREATE, true)
@withTranslation(['connections', 'app'])
@SingleComponent('connection', 'updating', ['connectors'], mapConnection)
class ConnectionUpdate extends Component{

    constructor(props){
        super(props);
        const {authUser} = this.props;
        this.startCheckingTitle = false;
        this.state = {
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
     * to redirect app after updating Connection
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
     * to validate title
     */
    validateTitle(connection){
        const {t} = this.props;
        if(connection.title === ''){
            setFocusById('input_connection_title');
            return {value: false, message: t('UPDATE.VALIDATION_MESSAGES.TITLE_REQUIRED')};
        } else {
            if(this.props.connection.title !== connection.title) {
                this.startCheckingTitle = true;
                this.props.checkConnectionTitle(connection.getObject());
                return {value: false, message: ''};
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

    render(){
        const {
            t, connectors, authUser, checkingConnectionTitle, checkTitleResult,
            updatingConnection, doAction,
        } = this.props;
        let {connection, error} = this.props;
        connection.error = error;
        let connectionClass = CConnection.createConnection(connection);
        let connectorMenuItems = this.getConnectorMenuItems();
        let contentTranslations = {};
        contentTranslations.header = t('UPDATE.HEADER');
        contentTranslations.list_button = {title: t('UPDATE.LIST_BUTTON'), index: 2};
        let changeContentTranslations = {};
        changeContentTranslations.updateButton = t('UPDATE.UPDATE_BUTTON');
        changeContentTranslations.testButton = t('UPDATE.TEST_BUTTON');
        let getListLink = `${connectionPrefixURL}`;
        let breadcrumbsItems = [t('UPDATE.FORM.PAGE_1'), t('UPDATE.FORM.PAGE_2')];
        let contents = [{
            inputs: [
                {
                    ...INPUTS.CONNECTION_TITLE,
                    tourStep: CONNECTION_UPDATE_TOURS.page_1[0].selector,
                    label: t('UPDATE.FORM.TITLE'),
                    maxLength: 256,
                    required: true,
                    check: (e, entity) => ::this.validateTitle(e, entity),
                    request: {
                        inProcess: checkingConnectionTitle,
                        status: this.startCheckingTitle && !checkingConnectionTitle,
                        result: checkTitleResult,
                        notSuccessMessage: t('UPDATE.FORM.TITLE_EXIST'),
                    }},
                {
                    ...INPUTS.CONNECTOR_READONLY,
                    label: t('UPDATE.FORM.CONNECTORS'),
                    placeholders: [t('UPDATE.FORM.CHOSEN_CONNECTOR_FROM'), t('UPDATE.FORM.CHOSEN_CONNECTOR_TO')],
                    source: connectorMenuItems,
                    connectors,
                    readOnly: true,
                },
            ],
            hint: {text: t('UPDATE.FORM.HINT_1'), openTour: ::this.openTour},
        },{
            inputs: [
                {
                    ...INPUTS.CONNECTOR_READONLY,
                    label: t('UPDATE.FORM.CONNECTORS'),
                    placeholders: [t('UPDATE.FORM.CHOSEN_CONNECTOR_FROM'), t('UPDATE.FORM.CHOSEN_CONNECTOR_TO')],
                    source: connectorMenuItems,
                    connectors,
                    readOnly: true,
                },
                {
                    ...INPUTS.METHODS,
                    tourSteps: CONNECTION_UPDATE_TOURS.page_2,
                    label: t('UPDATE.FORM.METHODS'),
                    templateLabels: {addTemplate: t('UPDATE.FORM.UPDATE_TEMPLATE'), addTemplateTitle: t('UPDATE.FORM.UPDATE_TEMPLATE_TITLE')},
                    actions: {addTemplate: ::this.addTemplate},
                    source: Object.freeze(connectors),
                    readOnly: false,
                },
            ],
            hint: {text: t('UPDATE.FORM.HINT_2'), openTour: ::this.openTour},
            extraAction: 'CHECK_CONNECTION',
        },
        ];
        return (
            <Content translations={contentTranslations} getListLink={getListLink} permissions={ConnectionPermissions} authUser={authUser}>
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    action={doAction}
                    entity={connectionClass}
                    type={'update'}
                    isActionInProcess={updatingConnection}
                    authUser={authUser}
                    onPageSwitch={::this.setCurrentTour}
                />
                <OCTour
                    steps={CONNECTION_UPDATE_TOURS[this.state.currentTour]}
                    isOpen={this.state.isTourOpen}
                    onRequestClose={::this.closeTour}
                />
            </Content>
        );
    }
}

export default ConnectionUpdate;