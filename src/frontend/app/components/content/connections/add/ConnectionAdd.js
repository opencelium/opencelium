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
import Content from "../../../general/content/Content";

import {checkConnectionTitle} from '@actions/connections/fetch';
import {addConnection} from '@actions/connections/add';
import {addTemplate} from "@actions/templates/add";
import {fetchConnectors} from '@actions/connectors/fetch';
import {ConnectionPermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {setFocusById} from "@utils/app";
import {INPUTS} from "@utils/constants/inputs";
import OCTour from "@basic_components/OCTour";
import {automaticallyShowTour, CONNECTION_ADD_TOURS} from "@utils/constants/tours";
import CConnection, {ALL_COLORS} from "@classes/components/content/connection/CConnection";
import ChangeContent from "@change_component/ChangeContent";
import {SingleComponent} from "@decorators/SingleComponent";
import {TEMPLATE_MODE} from "@classes/components/content/connection/CTemplate";
import {removeLS} from "@utils/LocalStorage";
import {ConnectionChange} from "@components/content/connections/ConnectionChange";


const connectionPrefixURL = '/connections';

function mapStateToProps(state){
    const auth = state.get('auth');
    const connections = state.get('connections');
    const connectors = state.get('connectors');
    return{
        authUser: auth.get('authUser'),
        addingConnection: connections.get('addingConnection'),
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
    return connection;
}

/**
 * Component to Add Connection
 */
@connect(mapStateToProps, {addConnection, addTemplate, fetchConnectors, checkConnectionTitle})
@permission(ConnectionPermissions.CREATE, true)
@withTranslation(['connections', 'app', 'basic_components'])
@SingleComponent('connection', 'adding', ['connectors'], mapConnection)
@ConnectionChange('add')
class ConnectionAdd extends Component{}

export default ConnectionAdd;