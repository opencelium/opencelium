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
import {fetchInvokers} from '../../../../actions/invokers/fetch';
import {deleteInvoker} from '../../../../actions/invokers/delete';

import List from '../../../general/list_of_components/List';
import {ListComponent} from "../../../../decorators/ListComponent";
import {InvokerPermissions} from "../../../../utils/constants/permissions";
import {permission} from "../../../../decorators/permission";
import {tour} from "../../../../decorators/tour";
import {LIST_TOURS} from "../../../../utils/constants/tours";

const prefixUrl = '/invokers';

function mapStateToProps(state){
    const auth = state.get('auth');
    const invokers = state.get('invokers');
    return {
        authUser: auth.get('authUser'),
        fetchingInvokers: invokers.get('fetchingInvokers'),
        deletingInvoker: invokers.get('deletingInvoker'),
        invokers: invokers.get('invokers').toJS(),
        isCanceled: invokers.get('isCanceled'),
        isRejected: invokers.get('isRejected'),
    };
}

function filterInvokerSteps(tourSteps){
    const {invokers, params} = this.props;
    let steps = tourSteps;
    switch(invokers.length){
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
 * List of the Invokers
 */
@connect(mapStateToProps, {fetchInvokers, deleteInvoker})
@permission(InvokerPermissions.READ, true)
@withTranslation('invokers')
@ListComponent('invokers')
@tour(LIST_TOURS, filterInvokerSteps)
class InvokersList extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, t, invokers, deleteInvoker, params, setTotalPages, openTour} = this.props;
        let translations = {};
        translations.header = {title: t('LIST.HEADER'), onHelpClick: openTour, breadcrumbs: [{link: '/admin_cards', text: t('LIST.HEADER_ADMIN_CARDS')}],};
        translations.add_button = t('LIST.ADD_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        let mapEntity = {};
        mapEntity.map = (invoker) => {
            let result = {};
            result.id = invoker.name;
            result.title = invoker.name;
            result.avatar = invoker.icon;
            return result;
        };
        //mapEntity.getViewLink = (invoker) => {return `${prefixUrl}/${invoker.name}/view`;};
        mapEntity.getUpdateLink = (invoker) => {return `${prefixUrl}/${invoker.name}/update`;};
        mapEntity.getAddLink = `${prefixUrl}/add`;
        mapEntity.onDelete = deleteInvoker;
        return <List
            entities={invokers}
            translations={translations}
            mapEntity={mapEntity}
            page={{pageNumber: params.pageNumber, link: `${prefixUrl}/page/`, entitiesLength: invokers.length}}
            setTotalPages={setTotalPages}
            permissions={InvokerPermissions}
            authUser={authUser}
        />;
    }
}


export default InvokersList;