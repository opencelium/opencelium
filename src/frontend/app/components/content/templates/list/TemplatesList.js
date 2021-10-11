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

import React, { Component }  from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import {fetchTemplates} from '@actions/templates/fetch';
import {convertTemplates, convertTemplatesRejected} from "@actions/templates/update";
import {deleteTemplate, deleteTemplates} from '@actions/templates/delete';

import List, {VIEW_TYPE} from '../../../general/list_of_components/List';
import {ListComponent} from "@decorators/ListComponent";
import {TemplatePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {tour} from "@decorators/tour";
import {LIST_TOURS} from "@utils/constants/tours";
import TemplateImport from "../import/TemplateImport";
import styles from '@themes/default/content/templates/list.scss';
import Loading from "@loading";
import {API_REQUEST_STATE} from "@utils/constants/app";
import FontIcon from "@basic_components/FontIcon";
import TemplateConversionIcon from "@components/general/app/TemplateConversionIcon";
import CExecution from "@classes/components/content/template_converter/CExecution";
import TemplateDownloadIcon from "@components/content/templates/list/TemplateDownloadIcon";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CTemplateVoiceControl from "@classes/voice_control/CTemplateVoiceControl";
import Button from "@basic_components/buttons/Button";

const prefixUrl = '/templates';

function mapStateToProps(state){
    const app = state.get('app');
    const auth = state.get('auth');
    const templates = state.get('templates');
    return {
        appVersion: app.get('appVersion'),
        authUser: auth.get('authUser'),
        fetchingTemplates: templates.get('fetchingTemplates'),
        deletingTemplate: templates.get('deletingTemplate'),
        deletingTemplates: templates.get('deletingTemplates'),
        currentTemplate: templates.get('template'),
        exportedTemplate: templates.get('exportedTemplate'),
        exportingTemplate: templates.get('exportingTemplate'),
        convertingTemplates: templates.get('convertingTemplates').toJS(),
        convertingTemplatesState: templates.get('convertingTemplatesState'),
        templates: templates.get('templates').toJS(),
        isCanceled: templates.get('isCanceled'),
        isRejected: templates.get('isRejected'),
    };
}

function filterTemplateSteps(tourSteps){
    const {templates, params} = this.props;
    let steps = tourSteps;
    switch(templates.length){
        case 0:
            steps = [];
            break;
        case 1:
            steps = tourSteps.card_1;
            break;
        default:
            if(params && params.pageNumber > 1) {
                steps = tourSteps.card_1;
            } else{
                steps = tourSteps.card_2;
            }
            break;
    }
    return steps;
}

/**
 * List of the Templates
 */
@connect(mapStateToProps, {fetchTemplates, deleteTemplate, deleteTemplates, convertTemplates, convertTemplatesRejected})
@permission(TemplatePermissions.READ, true)
@withTranslation('templates')
@ListComponent('templates')
@tour(LIST_TOURS, filterTemplateSteps)
class TemplatesList extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        CVoiceControl.initCommands({component:this}, CTemplateVoiceControl);
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component:this}, CTemplateVoiceControl);
    }

    convertAll(checks){
        const {appVersion, templates, convertTemplates, convertTemplatesRejected} = this.props;
        let convertingTemplates = [];
        for(let i = 0; i < templates.length; i++){
            if(templates[i].version !== appVersion){
                const {jsonData, error} = CExecution.executeConfig({fromVersion: templates[i].version, toVersion: appVersion}, templates[i].connection);
                if(error.message !== ''){
                    convertTemplatesRejected(error);
                    return;
                } else {
                    convertingTemplates.push({...templates[i], connection: jsonData, version: appVersion});
                }
            }
        }
        convertingTemplates = convertingTemplates.filter(t => checks.findIndex(c => c.value && c.id === t.templateId) !== -1);
            convertTemplates(convertingTemplates);
    }

    render(){
        const {authUser, t, templates, deleteTemplate, params, setTotalPages, openTour, exportedTemplate, exportingTemplate, convertingTemplates, convertingTemplatesState, deleteTemplates, deletingTemplate, deletingTemplates, currentTemplate} = this.props;
        let translations = {};
        translations.header = {title: t('LIST.HEADER'), onHelpClick: openTour, breadcrumbs: [{link: '/admin_cards', text: t('LIST.HEADER_ADMIN_CARDS')}]};
        translations.add_button = t('LIST.IMPORT_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        const renderListViewItemActions = (template) => {
            if(template)
                return <React.Fragment>
                    <TemplateConversionIcon data={{template}}/>
                    <TemplateDownloadIcon index={template.id} template={template}/>
                </React.Fragment>;
            return null;
        };
        let listViewData = {
            entityIdName: 'templateId',
            entityIdsName: 'templateIds',
            renderItemActions: renderListViewItemActions,
            isItemActionsBefore: true,
            deleteSelected: deleteTemplates,
            deletingSelected: deletingTemplates,
            map: (template) => {
                return [{name: 'id', value: template.templateId}, {name: 'name', label: t('LIST.NAME'), value: template.name, width: '20%'}, {name: 'description', label: t('LIST.DESCRIPTION'), value: template.description}, {name: 'from_invoker', label: t('LIST.FROM_INVOKER'), value: template.connection.fromConnector.invoker.name, width: '20%'}, {name: 'to_invoker', label: t('LIST.TO_INVOKER'), value: template.connection.toConnector.invoker.name, width: '20%'}]
            },
        }
        let mapEntity = {};
        mapEntity.map = (template, key) => {
            let result = {};
            let fromInvokerName = template.connection.fromConnector.invoker.name;
            let toInvokerName = template.connection.toConnector.invoker.name;
            let avatarElement;
            if(exportedTemplate.templateId === template.templateId && exportingTemplate === API_REQUEST_STATE.START){
                avatarElement = <Loading authUser={authUser} className={styles.export_loading}/>;
            } else{
                avatarElement =
                    <span className={styles.template_list_conversion}>
                        <TemplateConversionIcon data={{template}} classNameIcon={styles.loading}/>
                        <TemplateDownloadIcon index={key} template={template}/>
                    </span>;
            }
            result.id = template.templateId;
            result.title = template.name;
            result.subtitle = (
                <span className={styles.template_item_subtitle}>
                    <span style={{display: 'block', float: 'left'}}>{fromInvokerName}</span>
                    <FontIcon value={'arrow_right_alt'} style={{float: 'left', fontSize: '1.4vw'}}/>
                    <span style={{display: 'block', float: 'left'}}>{toInvokerName}</span>
                </span>
            );
            result.avatar = avatarElement;
            return result;
        };
        mapEntity.AddButton = TemplateImport;
        mapEntity.AdditionalButton = (thisListScope) => {
            if(thisListScope.state.viewType === VIEW_TYPE.GRID){
                return null;
            }
            const disabled = !::thisListScope.isOneChecked();
            return (
                <Button
                    icon={convertingTemplatesState === API_REQUEST_STATE.START ? 'loading' : 'play_arrow'}
                    title={t('LIST.CONVERT_ALL_BUTTON')}
                    disabled={disabled || convertingTemplatesState === API_REQUEST_STATE.START }
                    onClick={() => ::this.convertAll(thisListScope.state.checks)}
                />
            );
        };
        mapEntity.onDelete = deleteTemplate;
        return <List
            deletingEntity={(template) => deletingTemplate === API_REQUEST_STATE.START && template.id === currentTemplate.id}
            listViewData={listViewData}
            rerenderDependency={convertingTemplates.length}
            entities={templates}
            translations={translations}
            mapEntity={mapEntity}
            page={{pageNumber: params.pageNumber, link: `${prefixUrl}/page/`, entitiesLength: templates.length}}
            setTotalPages={setTotalPages}
            permissions={TemplatePermissions}
            authUser={authUser}
            componentName={'templates'}
        />;
    }
}


export default TemplatesList;