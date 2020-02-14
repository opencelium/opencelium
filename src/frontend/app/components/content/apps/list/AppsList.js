/*
 * Copyright (C) <2019>  <becon GmbH>
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
import {fetchApps, fetchAppsCanceled, loadAppsLink} from '../../../../actions/apps/fetch';

import List from '../../../general/list_of_components/List';
import {ListComponent} from "../../../../decorators/ListComponent";
import {AppPermissions} from "../../../../utils/constants/permissions";
import {permission} from "../../../../decorators/permission";
import {APP_TOURS} from "../../../../utils/constants/tours";
import {tour} from "../../../../decorators/tour";
import {APP_STATUS_DOWN} from "../../../../utils/constants/url";


const prefixUrl = '/apps';

function mapStateToProps(state){
    const auth = state.get('auth');
    const apps = state.get('apps');
    return {
        authUser: auth.get('authUser'),
        fetchingApps: apps.get('fetchingApps'),
        loadingAppsLink: apps.get('loadingAppsLink'),
        apps: apps.get('apps').toJS(),
        isCanceled: apps.get('isCanceled'),
        isRejected: apps.get('isRejected'),
    };
}

/**
 * List of the Applications
 */
@connect(mapStateToProps, {fetchApps, fetchAppsCanceled, loadAppsLink})
@permission(AppPermissions.READ, true)
@withTranslation('apps')
@ListComponent('apps')
@tour(APP_TOURS)
class AppsList extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, t, apps, params, setTotalPages, openTour, loadAppsLink, loadingAppsLink} = this.props;
        let translations = {};
        translations.header = {title: t('LIST.HEADER'), onHelpClick: openTour, breadcrumbs: [{link: '/admin_cards', text: t('LIST.HEADER_ADMIN_CARDS')}],};
        translations.add_button = t('LIST.ADD_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        let mapEntity = {};
        mapEntity.map = (app) => {
            let result = {};
            result.id = app.id;
            result.title = app.name;
            result.subtitle = app.status ? app.status : APP_STATUS_DOWN;
            result.avatar = app.icon;
            return result;
        };
        mapEntity.getOnCardClickLink = (app) => {return `${app.link}`;};
        return <List
            entities={apps}
            translations={translations}
            mapEntity={mapEntity}
            page={{pageNumber: params.pageNumber, link: `${prefixUrl}/page/`, entitiesLength: apps.length}}
            setTotalPages={setTotalPages}
            permissions={AppPermissions}
            authUser={authUser}
            load={{loadLink: loadAppsLink, loadingLink: loadingAppsLink}}
            containerStyles={{marginBottom: '70px'}}
        />;
    }
}


export default AppsList;