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
import {UpdateAssistantPermissions} from "@utils/constants/permissions";
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
import {API_REQUEST_STATE} from "@utils/constants/app";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import {logoutUserFulfilled} from "@actions/auth";


function mapStateToProps(state){
    const auth = state.get('auth');
    const updateAssistant = state.get('update_assistant');
    return{
        authUser: auth.get('authUser'),
        updatingSystem: updateAssistant.get('updatingSystem'),
    };
}

/**
 * Layout for UpdateAssistant
 */
@connect(mapStateToProps, {updateSystem, logoutUserFulfilled})
@permission(UpdateAssistantPermissions.CREATE, true)
@withTranslation(['update_assistant', 'app'])
class UpdateAssistant extends Component{

    constructor(props){
        super(props);
        const {authUser} = this.props;
        this.state = {
            currentTour: 'page_1',
            isTourOpen: automaticallyShowTour(authUser),
            updateData: {
                systemCheck: {},
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

    /**
     * to set appropriate Tour
     */
    setCurrentTour(pageNumber){
        const {authUser} = this.props;
        this.startCheckingName = false;
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
    validateAvailableUpdates(entity){
        const {t} = this.props;
        if (entity.availableUpdates && entity.availableUpdates.mode === '') {
            return {value: false, message: t('FORM.VALIDATION_MESSAGES.NO_UPDATE_MODE')};
        }
        if(entity.availableUpdates && entity.availableUpdates.selectedVersion === null){
            return {value: false, message: t('FORM.VALIDATION_MESSAGES.NO_SELECTED_VERSION')};
        }
        return {value: true, message: ''};
    }

    /**
     * to validate file update for templates
     */
    validateTemplateFileUpdate(entity){
        const {t} = this.props;
        if (entity.templateFileUpdate && entity.templateFileUpdate.updatedTemplates.length === 0) {
            return {value: false, message: t('FORM.VALIDATION_MESSAGES.TEMPLATE_UPDATE_ABSENT')};
        }
        if (entity.templateFileUpdate && !entity.templateFileUpdate.isFinishUpdate) {
            return {value: false, message: t('FORM.VALIDATION_MESSAGES.TEMPLATES_HAVE_ERROR')};
        }
        return {value: true, message: ''};
    }

    /**
     * to validate file update for invokers
     */
    validateInvokerFileUpdate(entity){
        const {t} = this.props;
        if (entity.invokerFileUpdate && entity.invokerFileUpdate.updatedInvokers.length === 0) {
            return {value: false, message: t('FORM.VALIDATION_MESSAGES.INVOKER_UPDATE_ABSENT')};
        }
        if (entity.invokerFileUpdate && !entity.invokerFileUpdate.isFinishUpdate) {
            return {value: false, message: t('FORM.VALIDATION_MESSAGES.INVOKERS_HAVE_ERROR')};
        }
        return {value: true, message: ''};
    }

    /**
     * to validate connection migration
     */
    validateConnectionMigration(entity){
        const {t} = this.props;
        if(!entity.connectionMigration.isFinishUpdate) {
            if (entity.connectionMigration && entity.connectionMigration.updatedConnections.length === 0) {
                return {value: false, message: t('FORM.VALIDATION_MESSAGES.CONNECTION_UPDATE_ABSENT')};
            }
            if (entity.connectionMigration && entity.connectionMigration.updatedConnections.length !== 0) {
                return {value: false, message: t('FORM.VALIDATION_MESSAGES.CONNECTIONS_HAVE_ERROR')};
            }
        }
        return {value: true, message: ''};
    }

    render(){
        const {updateData} = this.state;
        const {t, authUser, updatingSystem} = this.props;
        let contentTranslations = {};
        contentTranslations.header = {title: t('FORM.HEADER'), breadcrumbs: [{link: '/admin_cards', text: 'Admin Cards'}],};
        contentTranslations.list_button = '';
        let changeContentTranslations = {};
        changeContentTranslations.onlyTextButton = `${t('FORM.UPDATE_OC')} ${updateData.availableUpdates.selectedVersion ? updateData.availableUpdates.selectedVersion.name : ''}`;
        let getListLink = ``;
        let breadcrumbsItems = [t('FORM.PAGE_1'), t('FORM.PAGE_2'), t('FORM.PAGE_3'), t('FORM.PAGE_4'), t('FORM.PAGE_5'), t('FORM.PAGE_6')];
        let contents = [{
            inputs: [
                {
                    ...INPUTS.COMPONENT,
                    icon: 'notes',
                    tourStep: UPDATE_ASSISTANT_TOURS.page_1[0].selector,
                    name: 'systemCheck',
                    label: t('FORM.SYSTEM_CHECK'),
                    Component: SystemOverview
                },
            ],
            hint: {text: t('FORM.HINT_1'), openTour: ::this.openTour},
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    tourStep: UPDATE_ASSISTANT_TOURS.page_2[0].selector,
                    icon: 'backup',
                    name: 'availableUpdates',
                    label: t('FORM.AVAILABLE_UPDATES'),
                    Component: AvailableUpdates,
                    check: (e, entity) => ::this.validateAvailableUpdates(e, entity),
                },
            ],
            hint: {text: t('FORM.HINT_2'), openTour: ::this.openTour},
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    tourStep: UPDATE_ASSISTANT_TOURS.page_3[0].selector,
                    icon: 'description',
                    name: 'templateFileUpdate',
                    label: t('FORM.TEMPLATE_FILE_UPDATE'),
                    Component: TemplateFileUpdate,
                    check: (e, entity) => ::this.validateTemplateFileUpdate(e, entity),
                },
            ],
            hint: {text: t('FORM.HINT_3'), openTour: ::this.openTour},
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    tourStep: UPDATE_ASSISTANT_TOURS.page_4[0].selector,
                    icon: 'description',
                    name: 'invokerFileUpdate',
                    label: t('FORM.INVOKER_FILE_UPDATE'),
                    Component: InvokerFileUpdate,
                    check: (e, entity) => ::this.validateInvokerFileUpdate(e, entity),
                },
            ],
            hint: {text: t('FORM.HINT_4'), openTour: ::this.openTour},
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    tourStep: UPDATE_ASSISTANT_TOURS.page_5[0].selector,
                    icon: 'description',
                    name: 'connectionMigration',
                    label: t('FORM.CONNECTION_MIGRATION'),
                    Component: ConnectionFileUpdate,
                    check: (e, entity) => ::this.validateConnectionMigration(e, entity),
                },
            ],
            hint: {text: t('FORM.HINT_5'), openTour: ::this.openTour},
        },{
            inputs:[
                {
                    ...INPUTS.COMPONENT,
                    name: 'finishUpdate',
                    label: t('FORM.FINISH_UPDATE'),
                    Component: FinishUpdate,
                },
            ],
        },
        ];
        return (
            <Content translations={contentTranslations} getListLink={getListLink} permissions={UpdateAssistantPermissions} authUser={authUser}>
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    action={::this.updateSystem}
                    authUser={authUser}
                    onPageSwitch={::this.setCurrentTour}
                    entity={updateData}
                    isActionInProcess={updatingSystem}
                    type={'onlyText'}
                />
                <OCTour
                    steps={UPDATE_ASSISTANT_TOURS[this.state.currentTour]}
                    isOpen={this.state.isTourOpen}
                    onRequestClose={::this.closeTour}
                />
            </Content>
        );
    }
}

export default UpdateAssistant;