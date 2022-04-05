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

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {UpdateAssistantPermissions} from "@utils/constants/permissions";
import {INPUTS} from "@utils/constants/inputs";
import SystemOverview from "@update_assistant/system_overview/SystemOverview";
import AvailableUpdates, {ONLINE_UPDATE} from "@update_assistant/available_updates/AvailableUpdates";
import TemplateFileUpdate from "@update_assistant/file_update/TemplateFileUpdate";
import {permission} from "@decorators/permission";
import InvokerFileUpdate from "@update_assistant/file_update/InvokerFileUpdate";
import ConnectionFileUpdate from "@update_assistant/migration/ConnectionFileUpdate";
import FinishUpdate from "@update_assistant/FinishUpdate";

import CVoiceControl from "@classes/voice_control/CVoiceControl";
import Form from "@change_component/Form";
import {updateApplication as updateSystem, checkApplicationBeforeUpdate as checkResetFiles} from "@action/application/UpdateAssistantCreators";
import {logout as logoutUserFulfilled} from "@slice/application/AuthSlice";
import {API_REQUEST_STATE} from "@interface/application/IApplication";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const updateAssistant = state.updateAssistantReducer;
    return{
        authUser,
        updatingSystem: updateAssistant.updatingApplication,
        checkingResetFiles: updateAssistant.checkingApplicationBeforeUpdate,
        checkResetFilesResult: updateAssistant.checkResetFiles,
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

    updateSystem(){
        const {updateSystem} = this.props;
        const {updateData} = this.state;
        const data = {
            folder: updateData.availableUpdates.folder ? updateData.availableUpdates.folder : '',
            isOnline: updateData.availableUpdates.mode === ONLINE_UPDATE,
            version: updateData.availableUpdates.selectedVersion.name ? updateData.availableUpdates.selectedVersion.name : '',
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
        contentTranslations.header = {title: t('FORM.HEADER')};
        const isActionDisabled = !this.validateAvailableUpdates() || !this.validateTemplateFileUpdate() || !this.validateInvokerFileUpdate() || !this.validateConnectionMigration();
        contentTranslations.action_button = {title: `${t('FORM.UPDATE_OC')}`, isDisabled: isActionDisabled};
        let contents = [{
            inputs: [
                {
                    ...INPUTS.COMPONENT,
                    icon: 'notes',
                    name: 'systemRequirements',
                    label: t('FORM.SYSTEM_CHECK'),
                    Component: SystemOverview,
                    style: {minHeight: '300px'},
                    componentProps: {openNextForm: () => this.showNextFormSection('hasAvailableUpdates')},
                },
            ],
            hint: {text: t('FORM.HINT_1')},
            header: t(`FORM.PAGE_1`),
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    icon: 'backup',
                    name: 'availableUpdates',
                    label: t('FORM.AVAILABLE_UPDATES'),
                    Component: AvailableUpdates,
                    componentProps: {openNextForm: () => this.showNextFormSection('hasTemplateFileUpdate')},
                },
            ],
            hint: {text: t('FORM.HINT_2')},
            header: t(`FORM.PAGE_2`),
            visible: hasAvailableUpdates,
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    icon: 'description',
                    name: 'templateFileUpdate',
                    label: t('FORM.TEMPLATE_FILE_UPDATE'),
                    Component: TemplateFileUpdate,
                    componentProps: {openNextForm: () => this.showNextFormSection('hasInvokerFileUpdate')},
                },
            ],
            hint: {text: t('FORM.HINT_3')},
            header: t(`FORM.PAGE_3`),
            visible: hasAvailableUpdates && hasTemplateFileUpdate,
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    icon: 'description',
                    name: 'invokerFileUpdate',
                    label: t('FORM.INVOKER_FILE_UPDATE'),
                    Component: InvokerFileUpdate,
                    componentProps: {openNextForm: () => this.showNextFormSection('hasConnectionMigration')},
                },
            ],
            hint: {text: t('FORM.HINT_4')},
            header: t(`FORM.PAGE_4`),
            visible: hasTemplateFileUpdate && hasInvokerFileUpdate,
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    icon: 'description',
                    name: 'connectionMigration',
                    label: t('FORM.CONNECTION_MIGRATION'),
                    Component: ConnectionFileUpdate,
                    componentProps: {openNextForm: () => this.showNextFormSection('hasFinishUpdate')},
                },
            ],
            hint: {text: t('FORM.HINT_5')},
            header: t(`FORM.PAGE_5`),
            visible: hasInvokerFileUpdate && hasConnectionMigration,
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    name: 'finishUpdate',
                    label: t('FORM.FINISH_UPDATE'),
                    Component: FinishUpdate,
                    componentProps: {updateSystem: () => this.updateSystem()}
                },
            ],
            header: t(`FORM.PAGE_6`),
            visible: hasConnectionMigration && hasFinishUpdate,
        },
        ];
        return (
            <div>
                <Form
                    contents={contents}
                    translations={contentTranslations}
                    isActionInProcess={updatingSystem === API_REQUEST_STATE.START}
                    action={() => this.updateSystem()}
                    entity={updateData}
                    type={'onlyText'}
                />
            </div>
        );
    }
}

export default UpdateAssistant;