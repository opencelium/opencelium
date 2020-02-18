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
import ChangeContent from "../../../general/change_component/ChangeContent";

import {fetchConnector} from '../../../../actions/connectors/fetch';
import {updateConnector} from '../../../../actions/connectors/update';
import {testConnector} from '../../../../actions/connectors/test';
import {fetchInvokers} from '../../../../actions/invokers/fetch';
import {ConnectorPermissions} from "../../../../utils/constants/permissions";
import {permission} from "../../../../decorators/permission";
import {SingleComponent} from "../../../../decorators/SingleComponent";
import { AuthenticationTypes, DefaultAuthenticationType } from '../AuthenticationTypes';
import {INPUTS} from "../../../../utils/constants/inputs";
import {isString} from './../../../../utils/app';
import {CONNECTOR_TOURS, USERGROUP_TOURS} from "../../../../utils/constants/tours";
import OCTour from "../../../general/basic_components/OCTour";
import {API_REQUEST_STATE} from "../../../../utils/constants/app";
import {setFocusById} from "../../../../utils/app";

const connectorPrefixURL = '/connectors';

function mapStateToProps(state){
    const auth = state.get('auth');
    const connectors = state.get('connectors');
    const invokers = state.get('invokers');
    return{
        authUser: auth.get('authUser'),
        error: connectors.get('error'),
        connector: connectors.get('connector'),
        fetchingConnector: connectors.get('fetchingConnector'),
        testingConnector: connectors.get('testingConnector'),
        updatingConnector: connectors.get('updatingConnector'),
        testResult: connectors.get('testResult'),
        invokers: invokers.get('invokers').toJS(),
        fetchingInvokers: invokers.get('fetchingInvokers'),
    };
}

function mapConnector(connector){
    let data = {};
    const {id, title, icon, description, invoker, authenticationFields} = connector;
    data['id'] = id;
    data['title'] = title;
    data['icon'] = icon;
    data['description'] = description;
    data['invoker'] = {name: invoker.hasOwnProperty('value') ? invoker.value : invoker};
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
 * Component to Update Connector
 */
@connect(mapStateToProps, {testConnector, updateConnector, fetchInvokers, fetchConnector})
@permission(ConnectorPermissions.UPDATE, true)
@withTranslation(['connectors', 'app'])
@SingleComponent('connector', 'updating', ['invokers'], mapConnector)
class ConnectorUpdate extends Component{

    constructor(props){
        super(props);

        this.state = {
            authenticationFields: {},
            isTested: -1,
            currentTour: 'page_1',
            isTourOpen: false,
        };
    }

    componentDidMount(){
        const {connector, invokers} = this.props;
        let {authenticationFields} = this.state;
        if(invokers.length > 0) {
            let invokerName = connector.invoker.name;
            let invoker = invokers.find(invoker => invoker.name === invokerName);
            for (let i = 0; i < invokers.length; i++) {
                for(let j = 0; j < invokers[i].requiredData.length; j++){
                    if (invoker.requiredData.indexOf(invokers[i].requiredData[j]) !== -1 && invokerName === invokers[i].name) {
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

    UNSAFE_componentWillReceiveProps(nextProps){
        let {isTested} = this.state;
        if(nextProps.testingConnector === API_REQUEST_STATE.FINISH){
            if(nextProps.testResult === null || !nextProps.testResult.hasOwnProperty('status') || nextProps.testResult && (nextProps.testResult.status > 299 || nextProps.testResult.status < 199)){
                isTested = 0;
            } else{
                isTested = 1;
            }
        }
        this.setState({
            isTested,
        });
    }

    /**
     * to set initial status for test
     */
    initiateTestStatus(){
        this.setState({isTested: -1});
    }

    /**
     * to test connector before update
     */
    testConnector(connector){
        const {testConnector} = this.props;
        let data = this.parseBeforeAct(connector);
        testConnector(data);
    }

    /**
     * to parse connector before update
     */
    parseBeforeAct(connector){
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
     * to set appropriate Tour
     */
    setCurrentTour(pageNumber){
        this.setState({
            currentTour: `page_${pageNumber}`,
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
     * to redirect app after update
     */
    redirect(){
        this.props.router.push(`${connectorPrefixURL}`);
    }

    /**
     * to map invokers for select
     */
    mapInvokers(){
        const {invokers, t} = this.props;
        let result = {invokers: [], descriptions: []};
        result.invokers.push({label: t(`UPDATE.FORM.INVOKER_PLACEHOLDER`), value: 0});
        result.descriptions[0] = t(`UPDATE.FORM.INVOKER_DESCRIPTION_DEFAULT`);
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
        const {connector, params} = this.props;
        let result = {};
        if(connector) {
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
                    this.setState({authenticationFields});
                }
            }
        }
    }

    /**
     * to generate Authentication Inputs
     */
    generateAuthenticationInputs(){
        const {authenticationFields} = this.state;
        const {t, invokers} = this.props;
        let result = [];
        let tourIndex = -1;
        for(let i = 0; i < invokers.length; i++){
            for(let j = 0; j < invokers[i].requiredData.length; j++){
                let field = {};
                const fieldName = invokers[i].requiredData[j];
                const invokerName = invokers[i].name;
                if(AuthenticationTypes.hasOwnProperty(fieldName.toLowerCase())){
                    field = Object.create(AuthenticationTypes[fieldName.toLowerCase()]);
                } else{
                    field = Object.create(DefaultAuthenticationType);
                }
                field.name = invokerName + '__' + fieldName;
                tourIndex = CONNECTOR_TOURS.page_2.findIndex(s => s.key === field.key);
                if(tourIndex !== -1) {
                    field.tourStep = CONNECTOR_TOURS.page_2[tourIndex].selector;
                }
                field.label = t('UPDATE.FORM.'+fieldName.toUpperCase());
                field.visible = authenticationFields[invokerName + '__' + fieldName];
                field.required = authenticationFields[invokerName + '__' + fieldName];
                result.push(field);
            }
        }
        return result;
    }

    /**
     * (not used) to validate title on exist
     */
    validateTitle(entity){
        const {t} = this.props;
        if(entity.title === ''){
            setFocusById('input_title');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.TITLE_REQUIRED')};
        } else{
            //this.props.checkConnectorTitle(entity);
        }
        return {value: true, message: ''};
    }
    /**
     * to validate title
     */
    validateInvoker(entity){
        const {t} = this.props;
        if(entity.invoker === 0){
            setFocusById('input_invoker');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.INVOKER_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    /**
     * to filter steps tour
     */
    filterSteps(inputs){
        const {currentTour} = this.state;
        let steps = [];
        if(currentTour === 'page_2'){
            for(let i = 0; i < inputs.length; i++){
                let index = CONNECTOR_TOURS[currentTour].findIndex(s => s.key === inputs[i].key && inputs[i].visible);
                if(index !== -1){
                    steps.push(CONNECTOR_TOURS[currentTour][index]);
                }
            }
        } else{
            steps = CONNECTOR_TOURS[currentTour];
        }
        return steps;
    }

    /**
     * to do update
     */
    doAction(connector){
        const {doAction, params} = this.props;
        const {authenticationFields} = this.state;
        doAction({id: parseInt(params.id), ...connector, authenticationFields});
    }

    render(){
        const {t, authUser, updatingConnector, testingConnector} = this.props;
        let {invokers, descriptions} = this.mapInvokers();
        let parsedEntity = this.parseEntity();
        let contentTranslations = {};
        contentTranslations.header = t('UPDATE.HEADER');
        contentTranslations.list_button = t('UPDATE.LIST_BUTTON');
        let changeContentTranslations = {};
        changeContentTranslations.updateButton = t('UPDATE.UPDATE_BUTTON');
        changeContentTranslations.testButton = t('UPDATE.TEST_BUTTON');
        let getListLink = `${connectorPrefixURL}`;
        let breadcrumbsItems = [t('UPDATE.FORM.PAGE_1'), t('UPDATE.FORM.PAGE_2')];
        let authenticationInputs = this.generateAuthenticationInputs();
        let contents = [{
            inputs: [
                {...INPUTS.TITLE,
                    tourStep: CONNECTOR_TOURS.page_1[0].selector,
                    label: t('UPDATE.FORM.TITLE'),
                    maxLength: 32,
                    check: (e, entity) => ::this.validateTitle(e, entity),
                },
                {...INPUTS.DESCRIPTION, tourStep: CONNECTOR_TOURS.page_1[1].selector, label: t('UPDATE.FORM.DESCRIPTION')},
                {...INPUTS.INVOKER,
                    tourStep: CONNECTOR_TOURS.page_1[2].selector,
                    label: t('UPDATE.FORM.INVOKER'),
                    required: true,
                    source: invokers,
                    callback: ::this.chooseInvoker,
                    check: (e, entity) => ::this.validateInvoker(e, entity),
                    description: {name: 'description', label: t('UPDATE.FORM.INVOKER_DESCRIPTION'), values: descriptions},
                },
                {
                    ...INPUTS.ICON,
                    label: t('UPDATE.FORM.ICON'),
                    browseTitle: t('UPDATE.FORM.ICON_PLACEHOLDER'),
                },
            ],
            hint: {text: t('UPDATE.FORM.HINT_1'), openTour: ::this.openTour},
        },{
            inputs: authenticationInputs,
            hint: {text: t('UPDATE.FORM.HINT_2'), openTour: ::this.openTour},
            test: {isTested: this.state.isTested, callback: ::this.testConnector},
        },
        ];
        let steps = this.filterSteps(authenticationInputs);
        return (
            <Content translations={contentTranslations} getListLink={getListLink} permissions={ConnectorPermissions} authUser={authUser}>
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    action={::this.doAction}
                    entity={parsedEntity}
                    type={'update'}
                    isActionInProcess={updatingConnector === API_REQUEST_STATE.START || testingConnector === API_REQUEST_STATE.START ? API_REQUEST_STATE.START : API_REQUEST_STATE.INITIAL}
                    initiateTestStatus={::this.initiateTestStatus}
                    authUser={authUser}
                    onPageSwitch={::this.setCurrentTour}
                />
                <OCTour
                    steps={steps}
                    isOpen={this.state.isTourOpen}
                    onRequestClose={::this.closeTour}
                />
            </Content>
        );
    }
}

export default ConnectorUpdate;