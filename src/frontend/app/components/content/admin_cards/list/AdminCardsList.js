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
import {fetchAdminCards, loadAdminCardsLink} from '@actions/admin_cards/fetch';

import List from '../../../general/list_of_components/List';
import {ListComponent} from "@decorators/ListComponent";
import {AppPermissions, AdminCardPermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {ADMINCARD_TOURS} from "@utils/constants/tours";
import {tour} from "@decorators/tour";


const prefixUrl = '/admin_cards';

function mapStateToProps(state){
    const auth = state.get('auth');
    const adminCards = state.get('admincards');
    return {
        authUser: auth.get('authUser'),
        fetchingAdminCards: adminCards.get('fetchingAdminCards'),
        loadingAdminCardsLink: adminCards.get('loadingAdminCardsLink'),
        adminCards: adminCards.get('adminCards').toJS(),
        isCanceled: adminCards.get('isCanceled'),
        isRejected: adminCards.get('isRejected'),
    };
}

/**
 * List of the Admin Cards
 */
@connect(mapStateToProps, {fetchAdminCards, loadAdminCardsLink})
@permission(AppPermissions.READ, true)
@withTranslation('admin_cards')
@ListComponent('adminCards')
@tour(ADMINCARD_TOURS)
class AdminCardsList extends Component{

    constructor(props){
        super(props);
    }

    redirect(data){
        if(data && data.hasOwnProperty('link')) {
            this.props.router.push(data.link);
        }
    }

    render(){
        const {authUser, t, adminCards, params, setTotalPages, openTour, loadAdminCardsLink, loadingAdminCardsLink, router} = this.props;
        let translations = {};
        translations.header = {title: t('LIST.HEADER'), onHelpClick: openTour};
        translations.add_button = t('LIST.ADD_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        let mapEntity = {};
        mapEntity.map = (adminCard) => {
            let result = {};
            result.id = adminCard.id;
            result.title = adminCard.name;
            result.avatar = adminCard.icon;
            result.link = adminCard.link;
            return result;
        };
        mapEntity.getOnCardClickLink = (adminCard) => {return `${adminCard.link}`;};
        return <List
            entities={adminCards}
            translations={translations}
            mapEntity={mapEntity}
            page={{pageNumber: params.pageNumber, link: `${prefixUrl}/page/`, entitiesLength: adminCards.length}}
            setTotalPages={setTotalPages}
            permissions={AppPermissions}
            authUser={authUser}
            load={{loadLink: loadAdminCardsLink, loadingLink: loadingAdminCardsLink, callback: ::this.redirect}}
            containerStyles={{marginBottom: '70px'}}
            noSearchField={true}
        />;
    }
}


export default AdminCardsList;