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

import {checkConnectorTitle, fetchConnector} from '@actions/connectors/fetch';
import {updateConnector} from '@actions/connectors/update';
import {testConnector} from '@actions/connectors/test';
import {fetchInvokers} from '@actions/invokers/fetch';
import {permission} from "@decorators/permission";
import {SingleComponent} from "@decorators/SingleComponent";
import {ConnectorForm} from "@components/content/connectors/ConnectorForm";
import {ConnectorPermissions} from "@utils/constants/permissions";

function mapStateToProps(state){
    const auth = state.get('auth');
    const connectors = state.get('connectors');
    const invokers = state.get('invokers');
    return{
        authUser: auth.get('authUser'),
        error: connectors.get('error'),
        checkingConnectorTitle: connectors.get('checkingConnectorTitle'),
        checkTitleResult: connectors.get('checkTitleResult'),
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
    const {id, title, icon, description, invoker, timeout, sslCert, authenticationFields} = connector;
    data['id'] = id;
    data['title'] = title;
    data['icon'] = icon;
    data['timeout'] = timeout;
    data['sslCert'] = sslCert;
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
@connect(mapStateToProps, {testConnector, updateConnector, fetchInvokers, fetchConnector, checkConnectorTitle})
@permission(ConnectorPermissions.UPDATE, true)
@withTranslation(['connectors', 'app'])
@SingleComponent('connector', 'updating', ['invokers'], mapConnector)
@ConnectorForm('update')
class ConnectorUpdate extends Component{}

export default ConnectorUpdate;