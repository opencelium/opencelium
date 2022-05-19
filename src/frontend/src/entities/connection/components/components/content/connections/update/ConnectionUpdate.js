 /*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';

import {updateConnection, checkConnectionTitle, getConnectionById as fetchConnection} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {addTemplate, getTemplatesByConnectors as fetchTemplates} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import {getAllConnectors as fetchConnectors} from "@entity/connector/redux_toolkit/action_creators/ConnectorCreators";
import {setConnectionViewType} from "../../../../../redux_toolkit/slices/ConnectionSlice";
import {permission} from "@application/utils/permission";
import {ConnectionForm} from "@entity/connection/components/components/content/connections/ConnectionForm";
import {useNavigate} from "react-router";
import {useParams} from "react-router";
 import {ConnectionPermissions} from "@entity/connection/constants";

/*
* TODO: implement connection update
*/
function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const connectionViewType = state.applicationReducer.connectionViewType;
    const connection = state.connectionReducer;
    const template = state.templateReducer;
    const connector = state.connectorReducer;
    return{
        authUser,
        connectionViewType,
        connection: connection.currentConnection,
        fetchingConnection: connection.gettingConnection,
        updatingConnection: connection.updatingConnection,
        error: connection.error,
        savingTemplate: template.addingTemplate,
        connectors: connector.connectors.map(connector => {return {...connector, id: connector.connectorId}}),
        fetchingConnectors: connector.gettingConnectors,
        checkingConnectionTitle: connection.checkingConnectionTitle,
        checkTitleResult: connection.isCurrentConnectionHasUniqueTitle,
        validatingFormMethods: connection.validatingFormMethods,
        validateFormMethodsResult: connection.validateFormMethodsResult,
    };
}


/**
 * Component to Update Connection
 */
@connect(mapStateToProps, {updateConnection, addTemplate, fetchConnection, fetchConnectors, checkConnectionTitle, fetchTemplates, setConnectionViewType})
@permission(ConnectionPermissions.UPDATE, true)
@withTranslation(['connections', 'app', 'basic_components'])
@ConnectionForm('update')
class ConnectionUpdate extends Component{}


export default function(props) {
    const navigate = useNavigate();
    let urlParams = useParams();
    return <ConnectionUpdate {...props} navigate={navigate} params={urlParams}/>;
}