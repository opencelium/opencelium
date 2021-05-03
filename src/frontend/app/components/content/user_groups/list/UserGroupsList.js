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
import {fetchUserGroups, fetchUserGroupsCanceled} from '@actions/usergroups/fetch';
import {deleteUserGroup} from '@actions/usergroups/delete';

import List from '../../../general/list_of_components/List';
import {ListComponent} from "@decorators/ListComponent";
import {permission} from "@decorators/permission";
import {UserGroupPermissions} from "@utils/constants/permissions";
import {LIST_TOURS} from "@utils/constants/tours";
import {tour} from "@decorators/tour";


const prefixUrl = '/usergroups';

function mapStateToProps(state){
    const userGroups = state.get('userGroups');
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
        fetchingUserGroups: userGroups.get('fetchingUserGroups'),
        deletingUserGroup: userGroups.get('deletingUserGroup'),
        userGroups: userGroups.get('userGroups').toJS(),
        isCanceled: userGroups.get('isCanceled'),
        isRejected: userGroups.get('isRejected'),
    };
}

function filterGroupSteps(tourSteps){
    const {userGroups, params} = this.props;
    let steps = tourSteps;
    switch(userGroups.length){
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
 * List of the UserGroups
 */
@connect(mapStateToProps, {fetchUserGroups, fetchUserGroupsCanceled, deleteUserGroup})
@permission(UserGroupPermissions.READ, true)
@withTranslation('userGroups')
@ListComponent('userGroups')
@tour(LIST_TOURS, filterGroupSteps)
class UserGroupsList extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, t, userGroups, deleteUserGroup, params, setTotalPages, openTour} = this.props;
        let exceptionUserGroups = authUser && authUser.hasOwnProperty('userGroup') && authUser.userGroup && authUser.userGroup.hasOwnProperty('groupId') ? [authUser.userGroup.groupId] : [];
        let translations = {};
        translations.header = {title: t('LIST.HEADER'), onHelpClick: openTour};
        translations.add_button = t('LIST.ADD_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        let mapUserGroup = {};
        mapUserGroup.map = (userGroup) => {
            let result = {};
            result.id = userGroup.id;
            result.title = userGroup.role;
            return result;
        };
        mapUserGroup.getViewLink = (userGroup) => {return `${prefixUrl}/${userGroup.id}/view`;};
        mapUserGroup.getUpdateLink = (userGroup) => {return `${prefixUrl}/${userGroup.id}/update`;};
        mapUserGroup.getAddLink = `${prefixUrl}/add`;
        mapUserGroup.onDelete = deleteUserGroup;
        return <List
            entities={userGroups}
            exceptionEntities={{label: t('LIST.CURRENT_USER_GROUP'), exceptions: exceptionUserGroups}}
            translations={translations}
            mapEntity={mapUserGroup}
            page={{pageNumber: params.pageNumber, link: `${prefixUrl}/page/`, entitiesLength: userGroups.length}}
            setTotalPages={setTotalPages}
            permissions={UserGroupPermissions}
            authUser={authUser}
        />;
    }
}


export default UserGroupsList;