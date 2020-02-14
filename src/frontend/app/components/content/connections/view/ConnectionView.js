/*
 * Copyright (C) <2020>  <becon GmbH>
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
import ChangeContent from "../../../general/change_component/ChangeContent";

import {fetchConnection} from '../../../../actions/connections/fetch';
import {ConnectionPermissions} from "../../../../utils/constants/permissions";
import {permission} from "../../../../decorators/permission";
import {SingleComponent} from "../../../../decorators/SingleComponent";
import {INPUTS} from "../../../../utils/constants/inputs";
import CConnection from "../../../../classes/components/content/connection/CConnection";


const connectionPrefixURL = '/connections';

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

    render(){
        const {t, authUser, checkingConnectionTitle, checkTitleResult} = this.props;
        let connectors = [];
        let {connection} = this.props;
        let connectorMenuItems = [];
        let contentTranslations = {};
        contentTranslations.header = t('VIEW.HEADER');
        contentTranslations.list_button = {title: t('VIEW.LIST_BUTTON'), index: 2};
        let changeContentTranslations = {};
        changeContentTranslations.addButton = t('VIEW.VIEW_BUTTON');
        changeContentTranslations.testButton = t('VIEW.TEST_BUTTON');
        let getListLink = `${connectionPrefixURL}`;
        let breadcrumbsItems = [];
        let contents = [{
            inputs: [
                {
                    ...INPUTS.CONNECTION_TITLE,
                    label: t('VIEW.FORM.TITLE'),
                    maxLength: 256,
                    required: true,
                    readOnly: true,
                    check: (e, entity) => ::this.validateTitle(e, entity),
                    request: {
                        inProcess: checkingConnectionTitle,
                        status: this.startCheckingTitle && !checkingConnectionTitle,
                        result: checkTitleResult,
                        notSuccessMessage: t('VIEW.FORM.TITLE_EXIST'),
                    }},
                {
                    ...INPUTS.CONNECTOR_READONLY,
                    label: t('VIEW.FORM.CONNECTORS'),
                    placeholders: [t('VIEW.FORM.CHOSEN_CONNECTOR_FROM'), t('VIEW.FORM.CHOSEN_CONNECTOR_TO')],
                    source: connectorMenuItems,
                    readOnly: true,
                },
                {
                    ...INPUTS.METHODS,
                    label: t('VIEW.FORM.METHODS'),
                    templateLabels: {addTemplate: t('VIEW.FORM.VIEW_TEMPLATE'), addTemplateTitle: t('VIEW.FORM.VIEW_TEMPLATE_TITLE')},
                    source: Object.freeze(connectors),
                    readOnly: true,
                },
            ],
            hint: {text: t('VIEW.FORM.HINT_1')},
        }
        ];
        return (
            <Content translations={contentTranslations} getListLink={getListLink} permissions={ConnectionPermissions} authUser={authUser}>
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    authUser={authUser}
                    action={null}
                    isActionInProcess={false}
                    noBreadcrumbs={true}
                    noHint={true}
                    noNavigation={true}
                    entity={CConnection.createConnection(connection)}
                />
            </Content>
        );
    }
}

export default ConnectionView;