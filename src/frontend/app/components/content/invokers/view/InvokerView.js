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

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import Content from "../../../general/content/Content";
import ChangeContent from "../../../general/change_component/ChangeContent";

import {fetchInvoker} from '../../../../actions/invokers/fetch';
import {InvokerPermissions} from "../../../../utils/constants/permissions";
import {permission} from "../../../../decorators/permission";
import {INPUTS} from "../../../../utils/constants/inputs";
import {INVOKER_TOURS} from "../../../../utils/constants/tours";
import OCTour from "../../../general/basic_components/OCTour";
import {disableBodyScroll, enableBodyScroll} from "body-scroll-lock";
import {SingleComponent} from "../../../../decorators/SingleComponent";
import CInvoker from "../../../../classes/components/content/invoker/CInvoker";

const invokerPrefixURL = '/invokers';

function mapStateToProps(state){
    const auth = state.get('auth');
    const invokers = state.get('invokers');
    return{
        authUser: auth.get('authUser'),
        invoker: invokers.get('invoker'),
        fetchingInvoker: invokers.get('fetchingInvoker'),
        error: invokers.get('error'),
    };
}



/**
 * Component to View Invoker
 */
@connect(mapStateToProps, {fetchInvoker})
@permission(InvokerPermissions.CREATE, true)
@withTranslation(['invokers', 'app'])
@SingleComponent('invoker')
class InvokerView extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, authUser, invoker, updatingInvoker, doAction} = this.props;
        let contentTranslations = {};
        contentTranslations.header = t('VIEW.HEADER');
        contentTranslations.list_button = t('VIEW.LIST_BUTTON');
        let changeContentTranslations = {};
        changeContentTranslations.updateButton = t('VIEW.VIEW_BUTTON');
        let getListLink = `${invokerPrefixURL}`;
        let breadcrumbsItems = [t('VIEW.FORM.PAGE_1'), t('VIEW.FORM.PAGE_2'), t('VIEW.FORM.PAGE_3'), t('VIEW.FORM.PAGE_4')];
        let contents = [{
            inputs: [
                {
                    ...INPUTS.INVOKER_NAME,
                    label: t('VIEW.FORM.NAME'),
                    maxLength: 255,
                    readOnly: true,
                },
                {
                    ...INPUTS.INVOKER_DESCRIPTION,
                    label: t('VIEW.FORM.DESCRIPTION'),
                    readOnly: true,
                },
                {
                    ...INPUTS.INVOKER_HINT,
                    label: t('VIEW.FORM.HINT'),
                    maxLength: 255,
                    readOnly: true,
                },
                {
                    ...INPUTS.INVOKER_AUTHENTICATION,
                    label: t('VIEW.FORM.AUTHENTICATION'),
                    readOnly: true,
                },
            ],
            hint: {text: t('VIEW.FORM.HINT_1')},
        },{
            inputs: [
                {
                    ...INPUTS.INVOKER_OPERATIONS,
                    label: t('VIEW.FORM.OPERATIONS'),
                    defaultValue: [],
                    readOnly: true,
                },
            ],
            hint: {text: t('VIEW.FORM.HINT_4')},},
        ];
        return (
            <Content
                translations={contentTranslations}
                getListLink={getListLink}
                permissions={InvokerPermissions}
                authUser={authUser}
            >
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    authUser={authUser}
                    action={doAction}
                    isActionInProcess={updatingInvoker}
                    entity={CInvoker.createInvoker(invoker)}
                    type={'view'}
                />
            </Content>
        );
    }
}

export default InvokerView;