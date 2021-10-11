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
import {fetchNotificationTemplates} from '@actions/notification_templates/fetch';
import {deleteNotificationTemplate, deleteNotificationTemplates} from '@actions/notification_templates/delete';

import List from '../../../general/list_of_components/List';
import {ListComponent} from "@decorators/ListComponent";
import {NotificationTemplatePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {tour} from "@decorators/tour";
import {LIST_TOURS} from "@utils/constants/tours";
import {API_REQUEST_STATE} from "@utils/constants/app";

const prefixUrl = '/notification_templates';

function mapStateToProps(state){
    const auth = state.get('auth');
    const notificationTemplates = state.get('notificationTemplates');
    return {
        authUser: auth.get('authUser'),
        fetchingNotificationTemplates: notificationTemplates.get('fetchingNotificationTemplates'),
        deletingNotificationTemplate: notificationTemplates.get('deletingNotificationTemplate'),
        deletingNotificationTemplates: notificationTemplates.get('deletingNotificationTemplates'),
        currentNotificationTemplate: notificationTemplates.get('notificationTemplate'),
        notificationTemplates: notificationTemplates.get('notificationTemplates').toJS(),
        isCanceled: notificationTemplates.get('isCanceled'),
        isRejected: notificationTemplates.get('isRejected'),
    };
}

function filterNotificationTemplateSteps(tourSteps){
    const {notificationTemplates, params} = this.props;
    let steps = tourSteps;
    switch(notificationTemplates.length){
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
 * List of the NotificationTemplates
 */
@connect(mapStateToProps, {fetchNotificationTemplates, deleteNotificationTemplate, deleteNotificationTemplates})
@permission(NotificationTemplatePermissions.READ, true)
@withTranslation('notification_templates')
@ListComponent('notificationTemplates')
@tour(LIST_TOURS, filterNotificationTemplateSteps)
class NotificationTemplatesList extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, t, notificationTemplates, deleteNotificationTemplate, params, setTotalPages, openTour, deleteNotificationTemplates, deletingNotificationTemplate, deletingNotificationTemplates, currentNotificationTemplate} = this.props;
        let translations = {};
        translations.header = {title: t('LIST.HEADER'), onHelpClick: openTour, breadcrumbs: [{link: '/admin_cards', text: t('LIST.HEADER_ADMIN_CARDS')}],};
        translations.add_button = t('LIST.ADD_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        let listViewData = {
            entityIdName: 'id',
            entityIdsName: 'notificationTemplateIds',
            deleteSelected: deleteNotificationTemplates,
            deletingSelected: deletingNotificationTemplates,
            map: (notificationTemplate) => {
                return [{name: 'id', value: notificationTemplate.templateId}, {name: 'name', label: t('LIST.NAME'), value: notificationTemplate.name, width: '30%'}, {name: 'type', label: t('LIST.TYPE'), value: notificationTemplate.type, width: '35%'}]
            },
        }
        let mapEntity = {};
        mapEntity.map = (notificationTemplate) => {
            let result = {};
            result.id = notificationTemplate.templateId;
            result.title = notificationTemplate.name;
            result.avatar = notificationTemplate.icon;
            return result;
        };
        mapEntity.getViewLink = (notificationTemplate) => {const id = notificationTemplate.hasOwnProperty('id') ? notificationTemplate.id : notificationTemplate.templateId; return `${prefixUrl}/${id}/view`;};
        mapEntity.getUpdateLink = (notificationTemplate) => {const id = notificationTemplate.hasOwnProperty('id') ? notificationTemplate.id : notificationTemplate.templateId; return `${prefixUrl}/${id}/update`;};
        mapEntity.getAddLink = `${prefixUrl}/add`;
        mapEntity.onDelete = deleteNotificationTemplate;
        return <List
            deletingEntity={(notificationTemplate) => deletingNotificationTemplate === API_REQUEST_STATE.START && notificationTemplate.id === currentNotificationTemplate.id}
            entities={notificationTemplates}
            translations={translations}
            mapEntity={mapEntity}
            page={{pageNumber: params.pageNumber, link: `${prefixUrl}/page/`, entitiesLength: notificationTemplates.length}}
            setTotalPages={setTotalPages}
            permissions={NotificationTemplatePermissions}
            authUser={authUser}
            listViewData={listViewData}
            componentName={'notificationTemplates'}
        />;
    }
}


export default NotificationTemplatesList;