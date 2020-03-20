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

import React, { Component }  from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import {fetchTemplates, exportTemplate} from '../../../../actions/templates/fetch';
import {deleteTemplate} from '../../../../actions/templates/delete';

import List from '../../../general/list_of_components/List';
import {ListComponent} from "../../../../decorators/ListComponent";
import {TemplatePermissions} from "../../../../utils/constants/permissions";
import {permission} from "../../../../decorators/permission";
import {tour} from "../../../../decorators/tour";
import {LIST_TOURS} from "../../../../utils/constants/tours";
import TemplateImport from "../import/TemplateImport";
import styles from '../../../../themes/default/content/templates/list.scss';
import TooltipFontIcon from "../../../general/basic_components/tooltips/TooltipFontIcon";
import Loading from "../../../general/app/Loading";
import {API_REQUEST_STATE} from "../../../../utils/constants/app";
import FontIcon from "../../../general/basic_components/FontIcon";

const prefixUrl = '/templates';

function mapStateToProps(state){
    const auth = state.get('auth');
    const templates = state.get('templates');
    return {
        authUser: auth.get('authUser'),
        fetchingTemplates: templates.get('fetchingTemplates'),
        deletingTemplate: templates.get('deletingTemplate'),
        exportedTemplate: templates.get('exportedTemplate'),
        exportingTemplate: templates.get('exportingTemplate'),
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
@connect(mapStateToProps, {fetchTemplates, deleteTemplate, exportTemplate})
@permission(TemplatePermissions.READ, true)
@withTranslation('templates')
@ListComponent('templates')
@tour(LIST_TOURS, filterTemplateSteps)
class TemplatesList extends Component{

    constructor(props){
        super(props);
    }

    exportTemplate(e, template){
        this.props.exportTemplate(template);
    }

    render(){
        const {authUser, t, templates, deleteTemplate, params, setTotalPages, openTour, exportedTemplate, exportingTemplate} = this.props;
        let translations = {};
        translations.header = {title: t('LIST.HEADER'), onHelpClick: openTour};
        translations.add_button = t('LIST.IMPORT_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        let mapEntity = {};
        mapEntity.map = (template) => {
            let result = {};
            let fromInvokerName = template.connection.fromConnector.invoker.name;
            let toInvokerName = template.connection.toConnector.invoker.name;
            let avatarElement = null;
            if(exportedTemplate.templateId === template.templateId && exportingTemplate === API_REQUEST_STATE.START){
                avatarElement = <Loading authUser={authUser} className={styles.export_loading}/>;
            } else{
                avatarElement = <TooltipFontIcon className={styles.export} value={'get_app'} tooltip={'Download'} onClick={(e) => ::this.exportTemplate(e, template)}/>;
            }
            result.id = template.templateId;
            result.title = template.name;
            result.subtitle = <span style={{color: '#797979'}}><span style={{display: 'block', float: 'left', fontSize: '14px'}}>{fromInvokerName}</span><FontIcon value={'arrow_right_alt'} style={{float: 'left', fontSize: '22px'}}/><span style={{display: 'block', float: 'left', fontSize: '14px'}}>{toInvokerName}</span></span>;
            result.avatar = avatarElement;
            return result;
        };
        mapEntity.getAddComponent = TemplateImport;
        mapEntity.onDelete = deleteTemplate;
        return <List
            entities={templates}
            translations={translations}
            mapEntity={mapEntity}
            page={{pageNumber: params.pageNumber, link: `${prefixUrl}/page/`, entitiesLength: templates.length}}
            setTotalPages={setTotalPages}
            permissions={TemplatePermissions}
            authUser={authUser}
        />;
    }
}


export default TemplatesList;