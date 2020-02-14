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

import React, { Component }  from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import {fetchConnections, fetchConnectionsCanceled} from '../../../../actions/connections/fetch';
import {deleteConnection} from '../../../../actions/connections/delete';

import List from '../../../general/list_of_components/List';
import {ListComponent} from "../../../../decorators/ListComponent";
import {ConnectionPermissions} from "../../../../utils/constants/permissions";
import {permission} from "../../../../decorators/permission";
import {LIST_TOURS} from "../../../../utils/constants/tours";
import {tour} from "../../../../decorators/tour";


const prefixUrl = '/connections';

function mapStateToProps(state){
    const auth = state.get('auth');
    const connections = state.get('connections');
    return {
        authUser: auth.get('authUser'),
        fetchingConnections: connections.get('fetchingConnections'),
        deletingConnection: connections.get('deletingConnection'),
        connections: connections.get('connections').toJS(),
        isCanceled: connections.get('isCanceled'),
        isRejected: connections.get('isRejected'),
    };
}

function filterConnectionSteps(tourSteps){
    const {connections, params} = this.props;
    let steps = tourSteps;
    switch(connections.length){
        case 0:
            steps = [];
            break;
        case 1:
            steps = tourSteps.card_1;
            break;
        default:
            if(params && params.pageNumber > 1) {
                steps = tourSteps.card_1;
            } else{
                steps = tourSteps.card_2;
            }
            break;
    }
    return steps;
}

/**
 * List of the Connections
 */
@connect(mapStateToProps, {fetchConnections, fetchConnectionsCanceled, deleteConnection})
@permission(ConnectionPermissions.READ, true)
@withTranslation('connections')
@ListComponent('connections')
@tour(LIST_TOURS, filterConnectionSteps)
class ConnectionsList extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, t, connections, deleteConnection, params, setTotalPages, openTour} = this.props;
        let translations = {};
        translations.header = {title: t('LIST.HEADER'), onHelpClick: openTour};
        translations.add_button = t('LIST.ADD_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        let mapEntity = {};
        mapEntity.map = (connection) => {
            let result = {};
            result.id = connection.connectionId;
            result.title = connection.title;
            return result;
        };
        mapEntity.getViewLink = (connection) => {return `${prefixUrl}/${connection.connectionId}/view`;};
        mapEntity.getUpdateLink = (connection) => {return `${prefixUrl}/${connection.connectionId}/update`;};
        //mapEntity.getGraphLink = (connection) => {return `${prefixUrl}/${connection.connectionId}/graph`;};
        mapEntity.getAddLink = `${prefixUrl}/add`;
        mapEntity.onDelete = deleteConnection;
        return <List
            entities={connections}
            translations={translations}
            mapEntity={mapEntity}
            page={{pageNumber: params.pageNumber, link: `${prefixUrl}/page/`, entitiesLength: connections.length}}
            setTotalPages={setTotalPages}
            permissions={ConnectionPermissions}
            authUser={authUser}
        />;
    }
}


export default ConnectionsList;