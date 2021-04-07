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
import {fetchConnector} from '@actions/connectors/fetch';
import Content from "../../../general/content/Content";
import {SingleComponent} from "@decorators/SingleComponent";
import {permission} from "@decorators/permission";
import {ConnectorPermissions} from "@utils/constants/permissions";
import General from "./General";
import Invoker from "./Invoker";
import Operations from "./Operations";
import Hint from "./Hint";


const prefixUrl = '/connectors';

function mapStateToProps(state){
    const auth = state.get('auth');
    const connectors = state.get('connectors');
    return{
        authUser: auth.get('authUser'),
        error: connectors.get('error'),
        connector: connectors.get('connector'),
        fetchingConnector: connectors.get('fetchingConnector')
    };
}

/**
 * Component to View Connector
 */
@connect(mapStateToProps, {fetchConnector})
@permission(ConnectorPermissions.READ, true)
@withTranslation('connectors')
@SingleComponent('connector')
class ConnectorView extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, connector, authUser} = this.props;
        let translations = {};
        translations.header = t('VIEW.HEADER');
        translations.list_button = t('VIEW.LIST_BUTTON');
        let getListLink = `${prefixUrl}`;
        return (
            <Content translations={translations} getListLink={getListLink} permissions={ConnectorPermissions} authUser={authUser}>
                <General connector={connector}/>
                <Invoker connector={connector}/>
                <Hint connector={connector}/>
                <Operations connector={connector}/>
            </Content>
        );
    }
}

export default ConnectorView;