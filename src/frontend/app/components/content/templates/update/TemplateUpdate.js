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

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';

import {fetchTemplate} from "@actions/templates/fetch";
import {updateTemplate} from "@actions/templates/update";
import {fetchConnectors} from '@actions/connectors/fetch';
import {TemplatePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {SingleComponent} from "@decorators/SingleComponent";
import {fetchTemplates} from "@actions/templates/fetch";
import {setConnectionViewType} from "@actions/app";
import {TemplateForm} from "@components/content/templates/TemplateForm";


function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    const templates = state.get('templates');
    const connectors = state.get('connectors');
    return{
        authUser: auth.get('authUser'),
        connectionViewType: app.get('connectionViewType'),
        template: templates.get('template'),
        fetchingTemplate: templates.get('fetchingTemplate'),
        updatingTemplate: templates.get('updatingTemplate'),
        error: templates.get('error'),
        connectors: connectors.get('connectors').toJS(),
        fetchingConnectors: connectors.get('fetchingConnectors'),
    };
}


function mapTemplate(connection, pointer){
    return {...pointer.props.template, name: connection.title, description: connection.description, connection: connection.getObjectForBackend()};
}
/**
 * Component to Update Template
 */
@connect(mapStateToProps, {updateTemplate, fetchTemplate, fetchConnectors, fetchTemplates, setConnectionViewType})
@permission(TemplatePermissions.UPDATE, true)
@withTranslation(['templates', 'app', 'basic_components'])
@SingleComponent('template', 'updating', ['connectors'], mapTemplate)
@TemplateForm('update')
class TemplateUpdate extends Component{}

export default TemplateUpdate;