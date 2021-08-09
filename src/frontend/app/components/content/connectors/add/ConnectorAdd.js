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
import {addConnector} from '@actions/connectors/add';
import {testConnector} from '@actions/connectors/test';
import {checkConnectorTitle} from "@actions/connectors/fetch";
import {fetchInvokers} from '@actions/invokers/fetch';
import {ConnectorPermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {SingleComponent} from "@decorators/SingleComponent";
import {ConnectorChange} from "@components/content/connectors/ConnectorChange";



function mapStateToProps(state){
    const auth = state.get('auth');
    const connectors = state.get('connectors');
    const invokers = state.get('invokers');
    return{
        authUser: auth.get('authUser'),
        addingConnector: connectors.get('addingConnector'),
        testingConnector: connectors.get('testingConnector'),
        error: connectors.get('error'),
        checkingConnectorTitle: connectors.get('checkingConnectorTitle'),
        checkTitleResult: connectors.get('checkTitleResult'),
        testResult: connectors.get('testResult'),
        invokers: invokers.get('invokers').toJS(),
        fetchingInvokers: invokers.get('fetchingInvokers'),
    };
}

function mapConnector(connector){
    let data = {};
    const {title, description, icon, invoker, authenticationFields} = connector;
    data['title'] = title;
    data['description'] = description;
    data['icon'] = icon;
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
 * Component to Add Connector
 */
@connect(mapStateToProps, {testConnector, addConnector, fetchInvokers, checkConnectorTitle})
@permission(ConnectorPermissions.CREATE, true)
@withTranslation(['connectors', 'app'])
@SingleComponent('connector', 'adding', ['invokers'], mapConnector)
@ConnectorChange('add')
class ConnectorAdd extends Component{}

export default ConnectorAdd;