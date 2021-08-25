/*
 * Copyright (C) <2021>  <becon GmbH>
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

import React, {Component, Suspense} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {ConnectorPermissions, UpdateAssistantPermissions} from "@utils/constants/permissions";
import ChangeContent from "@change_component/ChangeContent";
import OCTour from "@basic_components/OCTour";
import {automaticallyShowTour, UPDATE_ASSISTANT_TOURS} from "@utils/constants/tours";
import Content from "@components/general/content/Content";
import {INPUTS} from "@utils/constants/inputs";
import SystemOverview from "@components/content/update_assistant/system_overview/SystemOverview";
import AvailableUpdates, {ONLINE_UPDATE} from "@components/content/update_assistant/available_updates/AvailableUpdates";
import TemplateFileUpdate from "@components/content/update_assistant/file_update/TemplateFileUpdate";
import {permission} from "@decorators/permission";
import InvokerFileUpdate from "@components/content/update_assistant/file_update/InvokerFileUpdate";
import ConnectionFileUpdate from "@components/content/update_assistant/migration/ConnectionFileUpdate";
import FinishUpdate from "@components/content/update_assistant/FinishUpdate";

import {updateSystem} from "@actions/update_assistant/update";
import {API_REQUEST_STATE, OC_NAME} from "@utils/constants/app";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import {logoutUserFulfilled} from "@actions/auth";
import {APP_STATUS_UP} from "@utils/constants/url";
import {checkResetFiles} from "@actions/update_assistant/check";
import Form from "@change_component/Form";


function mapStateToProps(state){
    const auth = state.get('auth');
    const updateAssistant = state.get('update_assistant');
    return{
        authUser: auth.get('authUser'),
        updatingSystem: updateAssistant.get('updatingSystem'),
        checkingResetFiles: updateAssistant.get('checkingResetFiles'),
        checkResetFilesResult: updateAssistant.get('checkResetFiles'),
    };
}

/**
 * Layout for UpdateAssistant
 */
@connect(mapStateToProps, {updateSystem, logoutUserFulfilled, checkResetFiles})
@permission(UpdateAssistantPermissions.CREATE, true)
@withTranslation(['update_assistant', 'app'])
class UpdateAssistant extends Component{

    constructor(props){
        super(props);
        const {authUser} = this.props;
        this.startCheckingResetFiles = false;
        this.state = {
            currentTour: 'page_1',
            isTourOpen: automaticallyShowTour(authUser),
            updateData: {
                systemRequirements: {},
                availableUpdates: {
                    mode: '',
                    selectedVersion: null,
                },
                templateFileUpdate:{
                    isFinishUpdate: false,
                    updatedTemplates: [],
                },
                invokerFileUpdate:{
                    isFinishUpdate: false,
                    updatedInvokers: [],
                },
                connectionMigration:{
                    isFinishUpdate: false,
                    updatedConnections: [],
                },
            },
            hasAvailableUpdates: false,
            hasTemplateFileUpdate: false,
            hasInvokerFileUpdate: false,
            hasConnectionMigration: false,
            hasFinishUpdate: false,
        };
        this.isUpdateStarted = false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.updatingSystem === API_REQUEST_STATE.FINISH && this.isUpdateStarted){
            this.isUpdateStarted = false;
            const {logoutUserFulfilled} = this.props;
            logoutUserFulfilled({});
            this.props.router.push(`/login`);
            CVoiceControl.removeAll();
        }
    }

    setValidationMessage(param, validationMessage){
        this.setState({
            validationMessages:{
                ...this.state.validationMessages,
                [param]: validationMessage,
            }
        })
    }

    showNextFormSection(formSection){
        this.setState({
            [formSection]: true,
        })
    }

    /**
     * to set appropriate Tour
     */
    setCurrentTour(pageNumber){
        const {authUser} = this.props;
        this.startCheckingResetFiles = false;
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

    updateSystem(){
        const {updateSystem} = this.props;
        const {updateData} = this.state;
        const data = {
            folder: updateData.availableUpdates.folder ? updateData.availableUpdates.folder : '',
            isOnline: updateData.availableUpdates.mode === ONLINE_UPDATE,
            version: updateData.availableUpdates.name ? updateData.availableUpdates.name : '',
            templates: updateData.templateFileUpdate.updatedTemplates.map(template => template.data),
            invokers: updateData.invokerFileUpdate.updatedInvokers.map(invoker => invoker.data),
            connections: updateData.connectionMigration.updatedConnections.map(connection => connection.data),
        };
        this.isUpdateStarted = true;
        updateSystem(data);
    }

    /**
     * to validate available updates
     */
    validateAvailableUpdates(){
        const {updateData} = this.state;
        if (updateData.availableUpdates && updateData.availableUpdates.mode === '') {
            return false;
        }
        if(updateData.availableUpdates && updateData.availableUpdates.selectedVersion === null){
            return false;
        }
        return true;
    }

    /**
     * to validate file update for templates
     */
    validateTemplateFileUpdate(){
        const {updateData} = this.state;
        if(!updateData.templateFileUpdate.isFinishUpdate){
            if (updateData.templateFileUpdate && updateData.templateFileUpdate.updatedTemplates.length === 0) {
                return false;
            }
            if (updateData.templateFileUpdate && !updateData.templateFileUpdate.isFinishUpdate) {
                return false;
            }
        }
        return true;
    }

    /**
     * to validate file update for invokers
     */
    validateInvokerFileUpdate(){
        const {updateData} = this.state;
        if(!updateData.invokerFileUpdate.isFinishUpdate) {
            if (updateData.invokerFileUpdate && updateData.invokerFileUpdate.updatedInvokers.length === 0) {
                return false;
            }
            if (updateData.invokerFileUpdate && !updateData.invokerFileUpdate.isFinishUpdate) {
                return false;
            }
        }
        return true;
    }

    /**
     * to validate connection migration
     */
    validateConnectionMigration(){
        const {updateData} = this.state;
        if(!updateData.connectionMigration.isFinishUpdate) {
            if (updateData.connectionMigration && updateData.connectionMigration.updatedConnections.length === 0) {
                return false;
            }
            if (updateData.connectionMigration && updateData.connectionMigration.updatedConnections.length !== 0) {
                return false;
            }
        }
        return true;
    }

    render(){
        const {updateData, hasAvailableUpdates, hasTemplateFileUpdate, hasInvokerFileUpdate, hasConnectionMigration, hasFinishUpdate} = this.state;
        const {t, updatingSystem} = this.props;
        let contentTranslations = {};
        contentTranslations.header = {title: t('FORM.HEADER'), onHelpClick: ::this.openTour};
        const isActionDisabled = !this.validateAvailableUpdates() || !this.validateTemplateFileUpdate() || !this.validateInvokerFileUpdate() || !this.validateConnectionMigration();
        contentTranslations.action_button = {title: `${t('FORM.UPDATE_OC')}`, isDisabled: isActionDisabled};
        let contents = [{
            inputs: [
                {
                    ...INPUTS.COMPONENT,
                    icon: 'notes',
                    tourStep: UPDATE_ASSISTANT_TOURS.page_1[0].selector,
                    name: 'systemRequirements',
                    label: t('FORM.SYSTEM_CHECK'),
                    Component: SystemOverview,
                    componentProps: {openNextForm: () => ::this.showNextFormSection('hasAvailableUpdates')},
                },
            ],
            hint: {text: t('FORM.HINT_1'), openTour: ::this.openTour},
            header: t(`FORM.PAGE_1`),
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    tourStep: UPDATE_ASSISTANT_TOURS.page_2[0].selector,
                    icon: 'backup',
                    name: 'availableUpdates',
                    label: t('FORM.AVAILABLE_UPDATES'),
                    Component: AvailableUpdates,
                    componentProps: {openNextForm: () => ::this.showNextFormSection('hasTemplateFileUpdate')},
                },
            ],
            hint: {text: t('FORM.HINT_2'), openTour: ::this.openTour},
            header: t(`FORM.PAGE_2`),
            visible: hasAvailableUpdates,
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    tourStep: UPDATE_ASSISTANT_TOURS.page_3[0].selector,
                    icon: 'description',
                    name: 'templateFileUpdate',
                    label: t('FORM.TEMPLATE_FILE_UPDATE'),
                    Component: TemplateFileUpdate,
                    componentProps: {openNextForm: () => ::this.showNextFormSection('hasInvokerFileUpdate')},
                },
            ],
            hint: {text: t('FORM.HINT_3'), openTour: ::this.openTour},
            header: t(`FORM.PAGE_3`),
            visible: hasTemplateFileUpdate,
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    tourStep: UPDATE_ASSISTANT_TOURS.page_4[0].selector,
                    icon: 'description',
                    name: 'invokerFileUpdate',
                    label: t('FORM.INVOKER_FILE_UPDATE'),
                    Component: InvokerFileUpdate,
                    componentProps: {openNextForm: () => ::this.showNextFormSection('hasConnectionMigration')},
                },
            ],
            hint: {text: t('FORM.HINT_4'), openTour: ::this.openTour},
            header: t(`FORM.PAGE_4`),
            visible: hasInvokerFileUpdate,
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    tourStep: UPDATE_ASSISTANT_TOURS.page_5[0].selector,
                    icon: 'description',
                    name: 'connectionMigration',
                    label: t('FORM.CONNECTION_MIGRATION'),
                    Component: ConnectionFileUpdate,
                    componentProps: {openNextForm: () => ::this.showNextFormSection('hasFinishUpdate')},
                },
            ],
            hint: {text: t('FORM.HINT_5'), openTour: ::this.openTour},
            header: t(`FORM.PAGE_5`),
            visible: hasConnectionMigration,
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    name: 'finishUpdate',
                    label: t('FORM.FINISH_UPDATE'),
                    Component: FinishUpdate,
                },
            ],
            header: t(`FORM.PAGE_6`),
            visible: hasFinishUpdate,
        },
        ];
        return (
            <div>
                <Form
                    contents={contents}
                    translations={contentTranslations}
                    isActionInProcess={updatingSystem}
                    action={::this.updateSystem}
                    entity={updateData}
                    type={'onlyText'}
                />
                <OCTour
                    steps={UPDATE_ASSISTANT_TOURS[this.state.currentTour]}
                    isOpen={this.state.isTourOpen}
                    onRequestClose={::this.closeTour}
                />
            </div>
        );
    }
}

export default UpdateAssistant;