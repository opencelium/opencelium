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
import {fetchUsers, fetchUsersCanceled} from '../../../../actions/users/fetch';
import {deleteUser} from '../../../../actions/users/delete';

import List from '../../../general/list_of_components/List';
import {ListComponent} from "../../../../decorators/ListComponent";
import {permission} from "../../../../decorators/permission";
import {UserPermissions} from "../../../../utils/constants/permissions";
import {tour} from "../../../../decorators/tour";
import {LIST_TOURS} from "../../../../utils/constants/tours";


const prefixUrl = '/users';

function mapStateToProps(state){
    const users = state.get('users');
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
        fetchingUsers: users.get('fetchingUsers'),
        deletingUser: users.get('deletingUser'),
        users: users.get('users').toJS(),
        isCanceled: users.get('isCanceled'),
        isRejected: users.get('isRejected'),
    };
}

function filterUserSteps(tourSteps){
    const {users, params} = this.props;
    let steps = tourSteps;
    switch(users.length){
        case 0:
            steps = [];
            break;
        case 1:
            steps = tourSteps.card_1_user;
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
 * List of Users
 */
@connect(mapStateToProps, {fetchUsers, fetchUsersCanceled, deleteUser})
@permission(UserPermissions.READ, true)
@withTranslation('users')
@ListComponent('users')
@tour(LIST_TOURS, filterUserSteps)
class UsersList extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, users, deleteUser, params, setTotalPages, authUser, openTour} = this.props;
        let exceptionUsers = [authUser.userId];
        let translations = {};
        translations.header = {title: t('LIST.HEADER'), onHelpClick: openTour};
        translations.add_button = t('LIST.ADD_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        let mapEntity = {};
        mapEntity.map = (user) => {
            let result = {};
            result.id = user.id;
            result.title = user.userDetail.name + ' ' + user.userDetail.surname;
            result.subtitle = user.email;
            result.avatar = user.userDetail.photo_s;
            return result;
        };
        mapEntity.getViewLink = (user) => {return `${prefixUrl}/${user.id}/view`;};
        mapEntity.getUpdateLink = (user) => {return `${prefixUrl}/${user.id}/update`;};
        mapEntity.getAddLink = `${prefixUrl}/add`;
        mapEntity.onDelete = deleteUser;
        return <List
            entities={users}
            exceptionEntities={{label: t('LIST.CURRENT_USER'), exceptions: exceptionUsers}}
            translations={translations}
            mapEntity={mapEntity}
            page={{pageNumber: params.pageNumber, link: `${prefixUrl}/page/`, entitiesLength: users.length}}
            setTotalPages={setTotalPages}
            permissions={UserPermissions}
            authUser={authUser}
        />;
    }
}


export default UsersList;