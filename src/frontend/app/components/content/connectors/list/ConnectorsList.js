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

import React, { Component }  from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import {fetchConnectors, fetchConnectorsCanceled} from '@actions/connectors/fetch';
import {addConnectorIcon} from "@actions/connectors/add";
import {deleteConnector} from '@actions/connectors/delete';

import List from '../../../general/list_of_components/List';
import {ListComponent} from "@decorators/ListComponent";
import {ConnectorPermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {tour} from "@decorators/tour";
import {LIST_TOURS} from "@utils/constants/tours";
import ImageCropView from "@components/general/app/ImageCropView";
import {isString} from "@utils/app";
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";


const prefixUrl = '/connectors';

function mapStateToProps(state){
    const auth = state.get('auth');
    const connectors = state.get('connectors');
    return {
        authUser: auth.get('authUser'),
        fetchingConnectors: connectors.get('fetchingConnectors'),
        deletingConnector: connectors.get('deletingConnector'),
        addingConnectorIcon: connectors.get('addingConnectorIcon'),
        connectors: connectors.get('connectors').toJS(),
        isCanceled: connectors.get('isCanceled'),
        isRejected: connectors.get('isRejected'),
    };
}

function filterConnectorSteps(tourSteps){
    const {connectors, params} = this.props;
    let steps = tourSteps;
    switch(connectors.length){
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
 * List of the Connectors
 */
@connect(mapStateToProps, {fetchConnectors, fetchConnectorsCanceled, deleteConnector, addConnectorIcon})
@permission(ConnectorPermissions.READ, true)
@withTranslation('connectors')
@ListComponent('connectors')
@tour(LIST_TOURS, filterConnectorSteps)
class ConnectorsList extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, t, connectors, deleteConnector, params, setTotalPages, openTour, addConnectorIcon, addingConnectorIcon} = this.props;
        let translations = {};
        translations.header = {title: t('LIST.HEADER'), onHelpClick: openTour};
        translations.add_button = t('LIST.ADD_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        let listViewData = {
            entityIdName: 'id',
            entityIdsName: 'connectorIds',
            deleteSelected: () => {},
            map: (connector) => {
                return [{name: 'id', value: connector.id}, {name: 'name', label: t('LIST.NAME'), value: connector.name, width: '20%'}, {name: 'description', label: t('LIST.DESCRIPTION'), value: connector.description, width: '25%'}, {name: 'invoker', label: t('LIST.INVOKER'), value: connector.invoker.name}]
            },
        }
        let mapEntity = {};
        mapEntity.map = (connector) => {
            let result = {};
            const mapping = (data) => {return {connectorId: data.entityId, icon: data.croppedImage};};
            result.id = connector.id;
            result.title = connector.name;
            result.avatar = <ImageCropView entityId={connector.id} mapping={mapping} title={connector.name} icon={CConnectorItem.hasIcon(connector.icon) ? connector.icon : connector.invoker.icon} uploadIcon={addConnectorIcon} uploadingIcon={addingConnectorIcon}/>;
            return result;
        };
        mapEntity.getViewLink = (connector) => {return `${prefixUrl}/${connector.id}/view`;};
        mapEntity.getUpdateLink = (connector) => {return `${prefixUrl}/${connector.id}/update`;};
        mapEntity.getAddLink = `${prefixUrl}/add`;
        mapEntity.onDelete = deleteConnector;
        return <List
            reducerName={'connectors'}
            entities={connectors}
            translations={translations}
            mapEntity={mapEntity}
            page={{pageNumber: params.pageNumber, link: `${prefixUrl}/page/`, entitiesLength: connectors.length}}
            setTotalPages={setTotalPages}
            permissions={ConnectorPermissions}
            authUser={authUser}
            listViewData={listViewData}
            rerenderDependency={addingConnectorIcon}
        />;
    }
}


export default ConnectorsList;