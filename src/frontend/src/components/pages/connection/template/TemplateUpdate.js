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

import {addConnection, checkConnectionTitle} from "@action/connection/ConnectionCreators";
import {getTemplateById as fetchTemplate, getAllTemplates as fetchTemplates, checkTemplateName} from "@action/connection/TemplateCreators";
import {updateTemplate} from "@action/connection/TemplateCreators";
import {getAllConnectors as fetchConnectors} from '@action/ConnectorCreators';
import {permission} from "../../../../decorators/permission";
import {setConnectionViewType} from "@slice/application/ApplicationSlice";
import {TemplateForm} from "./TemplateForm";
import {useNavigate, useParams} from "react-router";
import {ConnectionPermissions} from "@constants/permissions";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const connectionViewType = state.applicationReducer.connectionViewType;
    const templateReducer = state.templateReducer
    const connectorReducer = state.connectorReducer;
    const connectionReducer = state.connectionReducer;
    return{
        authUser,
        connectionViewType,
        template: templateReducer.currentTemplate,
        fetchingTemplate: templateReducer.gettingTemplate,
        updatingTemplate: templateReducer.updatingTemplate,
        error: templateReducer.error,
        connectors: connectorReducer.connectors,
        fetchingConnectors: connectorReducer.gettingConnectors,
        addingConnection: connectionReducer.addingConnection,
        checkingConnectionTitle: connectionReducer.checkingConnectionTitle,
        checkTitleResult: connectionReducer.isCurrentConnectionHasUniqueTitle,
    };
}

/**
 * Component to Update Template
 */
@connect(mapStateToProps, {addConnection, checkConnectionTitle, updateTemplate, fetchTemplate, fetchConnectors, fetchTemplates, checkTemplateName, setConnectionViewType})
@permission(ConnectionPermissions.UPDATE, true)
@withTranslation(['templates', 'app', 'basic_components'])
@TemplateForm('update')
class TemplateUpdate extends Component{}

export default function(props) {
    const navigate = useNavigate();
    let urlParams = useParams();
    return <TemplateUpdate {...props} navigate={navigate} params={urlParams}/>;
}