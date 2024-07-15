/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React, {Component, useEffect} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';

import {setFullScreen} from "@application/redux_toolkit/slices/ApplicationSlice";
import {
    setConnection,
    setCurrentConnection, setSavePanelVisibility,
    setTemplatePanelVisibility, setWebhooks
} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {
    getConnectionById as fetchConnection,
    getConnectionWebhooks
} from '@entity/connection/redux_toolkit/action_creators/ConnectionCreators';
import {permission} from "@entity/application/utils/permission";
import {ConnectionForm} from "@entity/connection/components/components/content/connections/ConnectionForm";
import {useNavigate, useParams} from "react-router";
import {ConnectionPermissions} from "@entity/connection/constants";
import {useAppDispatch} from "@application/utils/store";


const connectionPrefixURL = '/connections';

function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    const connection = state.connectionReducer;
    return{
        authUser,
        error: connection.error,
        connection: connection.currentConnection,
        fetchingConnection: connection.gettingConnection,
    };
}


/**
 * Component to View Connection
 */
@connect(mapStateToProps, {
    fetchConnection, setFullScreen, getConnectionWebhooks, setCurrentConnection,
    setConnection,
})
@permission(ConnectionPermissions.READ, true)
@withTranslation(['connections', 'app'])
@ConnectionForm('view')
class ConnectionView extends Component{}

export default function(props) {
    const navigate = useNavigate();
    let urlParams = useParams();
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(setTemplatePanelVisibility(false))
        dispatch(setSavePanelVisibility(false))
        dispatch(setWebhooks([]));
    }, []);
    return <ConnectionView {...props} navigate={navigate} params={urlParams} />;
}
