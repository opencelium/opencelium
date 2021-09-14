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
import {InvokerPermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import {SingleComponent} from "@decorators/SingleComponent";
import {InvokerForm} from "@components/content/invokers/InvokerForm";
import {updateInvoker} from "@actions/invokers/update";
import {checkName, fetchInvoker} from "@actions/invokers/fetch";


function mapStateToProps(state){
    const auth = state.get('auth');
    const invokers = state.get('invokers');
    return{
        authUser: auth.get('authUser'),
        invoker: invokers.get('invoker'),
        fetchingInvoker: invokers.get('fetchingInvoker'),
        updatingInvoker: invokers.get('updatingInvoker'),
        error: invokers.get('error'),
    };
}

function mapConnector(invoker){
    return {xml: invoker.getXml()};
}

/**
 * Component to Add Invoker
 */
@connect(mapStateToProps, {updateInvoker, fetchInvoker, checkName})
@permission(InvokerPermissions.UPDATE, true)
@withTranslation(['invokers', 'app'])
@SingleComponent('invoker', 'updating', [], mapConnector)
@InvokerForm('update')
class InvokerUpdate extends Component{}

export default InvokerUpdate;