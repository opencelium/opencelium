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
import {CONNECTION_ADD_TOURS} from "@utils/constants/tours";


const connectionPrefixURL = '/connection_overview_2';

function mapStateToProps(state){
    const auth = state.get('auth');
    const connections = state.get('connections');
    return{
        authUser: auth.get('authUser'),
        error: connections.get('error'),
        connection: connections.get('connection'),
        fetchingConnection: connections.get('fetchingConnection'),
    };
}


/**
 * Component to View Connection
 */
@connect(mapStateToProps, {fetchConnection})
@permission(ConnectionPermissions.READ, true)
@withTranslation(['connections', 'app'])
@SingleComponent('connection')
class ConnectionView extends Component{

    constructor(props){
        super(props);
    }

    doAction(){
        this.props.router.push(`${connectionPrefixURL}`);
    }

    render(){
        const {t, authUser, checkingConnectionTitle, checkTitleResult} = this.props;
        let connectors = [];
        let {connection} = this.props;
        connection.readOnly = true;
        let connectorMenuItems = [];
        let contentTranslations = {};
        contentTranslations.header = t('VIEW.HEADER');
        contentTranslations.list_button = {title: t('VIEW.LIST_BUTTON'), index: 2};
        let changeContentTranslations = {};
        changeContentTranslations.onlyTextButton = t('VIEW.LIST_BUTTON');
        changeContentTranslations.testButton = t('VIEW.TEST_BUTTON');
        let getListLink = `${connectionPrefixURL}`;
        let breadcrumbsItems = [];
        let contents = [{
            inputs: [
                {
                    ...INPUTS.CONNECTION_SVG,
                    tourSteps: CONNECTION_ADD_TOURS.page_3,
                    label: t('ADD.FORM.METHODS'),
                    source: Object.freeze(connectors),
                    readOnly: true,
                },
            ],
            hint: {text: t('VIEW.FORM.HINT_1')},
            isExternalComponent: true
        }
        ];
        return (
            <Content translations={contentTranslations} getListLink={getListLink} permissions={ConnectionPermissions} authUser={authUser}>
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    authUser={authUser}
                    action={::this.doAction}
                    entity={CConnection.createConnection(connection)}
                    isActionInProcess={1}
                    noBreadcrumbs={true}
                    noHint={true}
                    noNavigation={true}
                    type={'onlyText'}
                />
            </Content>
        );
    }
}

export default ConnectionView;