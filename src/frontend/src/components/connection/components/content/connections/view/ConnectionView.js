/*
 * Copyright (C) <2022>  <becon GmbH>
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

import {getConnectionById as fetchConnection} from '@action/connection/ConnectionCreators';
import {getAllConnectors as fetchConnectors} from "@action/ConnectorCreators";
import {ConnectionPermissions} from "@constants/permissions";
import {permission} from "../../../../../../decorators/permission";
import {ConnectionForm} from "@components/content/connections/ConnectionForm";
import {setConnectionViewType} from "@slice/application/ApplicationSlice";
import {useNavigate, useParams} from "react-router";


const connectionPrefixURL = '/connections';

function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const connectionViewType = state.applicationReducer.connectionViewType;
    const connection = state.connectionReducer;
    return{
        authUser,
        connectionViewType,
        error: connection.error,
        connection: connection.currentConnection,
        fetchingConnection: connection.gettingConnection,
    };
}


/**
 * Component to View Connection
 */
@connect(mapStateToProps, {fetchConnection, setConnectionViewType})
@permission(ConnectionPermissions.READ, true)
@withTranslation(['connections', 'app'])
@ConnectionForm('view')
class ConnectionView extends Component{}

export default function(props) {
    const navigate = useNavigate();
    let urlParams = useParams();
    return <ConnectionView {...props} navigate={navigate} params={urlParams} />;
}