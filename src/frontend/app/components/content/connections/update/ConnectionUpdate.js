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

import {checkConnectionTitle} from '@actions/connections/fetch';
import {fetchConnection} from "@actions/connections/fetch";
import {updateConnection} from "@actions/connections/update";
import {addTemplate} from "@actions/templates/add";
import {fetchConnectors} from '@actions/connectors/fetch';
import {ConnectionPermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {SingleComponent} from "@decorators/SingleComponent";
import {ConnectionForm} from "@components/content/connections/ConnectionForm";
import {fetchTemplates} from "@actions/templates/fetch";
import {setConnectionViewType} from "@actions/app";


function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    const connections = state.get('connections');
    const connectors = state.get('connectors');
    return{
        authUser: auth.get('authUser'),
        connectionViewType: app.get('connectionViewType'),
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
    return typeof connection.getObject === 'function' ? connection.getObject() : connection;
}

/**
 * Component to Update Connection
 */
@connect(mapStateToProps, {updateConnection, addTemplate, fetchConnection, fetchConnectors, checkConnectionTitle, fetchTemplates, setConnectionViewType})
@permission(ConnectionPermissions.UPDATE, true)
@withTranslation(['connections', 'app', 'basic_components'])
@SingleComponent('connection', 'updating', ['connectors'], mapConnection)
@ConnectionForm('update')
class ConnectionUpdate extends Component{}

export default ConnectionUpdate;