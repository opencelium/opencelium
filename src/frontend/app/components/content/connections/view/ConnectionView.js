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
import ChangeContent from "@change_component/ChangeContent";

import {fetchConnection} from '@actions/connections/fetch';
import {ConnectionPermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {SingleComponent} from "@decorators/SingleComponent";
import {INPUTS} from "@utils/constants/inputs";
import CConnection from "@classes/components/content/connection/CConnection";
import {ConnectionForm} from "@components/content/connections/ConnectionForm";
import {setConnectionViewType} from "@actions/app";


const connectionPrefixURL = '/connections';

function mapStateToProps(state){
    const auth = state.get('auth');
    const app = state.get('app');
    const connections = state.get('connections');
    return{
        authUser: auth.get('authUser'),
        connectionViewType: app.get('connectionViewType'),
        error: connections.get('error'),
        connection: connections.get('connection'),
        fetchingConnection: connections.get('fetchingConnection'),
    };
}


/**
 * Component to View Connection
 */
@connect(mapStateToProps, {fetchConnection, setConnectionViewType})
@permission(ConnectionPermissions.READ, true)
@withTranslation(['connections', 'app'])
@SingleComponent('connection')
@ConnectionForm('view')
class ConnectionView extends Component{}

export default ConnectionView;