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
import {updateInvoker} from '../../../../actions/invokers/update';
import {InvokerPermissions} from "../../../../utils/constants/permissions";
import {permission} from "../../../../decorators/permission";
import {INPUTS} from "../../../../utils/constants/inputs";
import {automaticallyShowTour, INVOKER_TOURS} from "../../../../utils/constants/tours";
import OCTour from "../../../general/basic_components/OCTour";
import {disableBodyScroll, enableBodyScroll} from "body-scroll-lock";
import {SingleComponent} from "../../../../decorators/SingleComponent";
import CInvoker from "../../../../classes/components/content/invoker/CInvoker";
import {setFocusById} from "../../../../utils/app";

const invokerPrefixURL = '/invokers';

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


function mapInvoker(invoker){
    return {xml: invoker.getXml()};
}

/**
 * Component to Update Invoker
 */
@connect(mapStateToProps, {updateInvoker, fetchInvoker})
@permission(InvokerPermissions.CREATE, true)
@withTranslation(['invokers', 'app'])
@SingleComponent('invoker', 'updating', [], mapInvoker)
class InvokerUpdate extends Component{

    constructor(props){
        super(props);

        const{authUser} = this.props;

        this.state = {
            currentTour: 'page_1',
            isTourOpen: automaticallyShowTour(authUser),
        };
    }

    componentDidMount(){
        setFocusById('input_name');
    }

    /**
     * to set appropriate Tour
     */
    setCurrentTour(pageNumber){
        const {authUser} = this.props;
        this.setState({
            currentTour: `page_${pageNumber}`,
            isTourOpen: automaticallyShowTour(authUser),
        });
    }

    /**
     * to close current Tour
     */
    closeTour(){
        this.setState({
            isTourOpen: false,
        });
    }

    /**
     * to open current Tour
     */
    openTour(){
        let updateInvokerHeader = document.getElementById('update_invoker_header');
        if(updateInvokerHeader && updateInvokerHeader.nextSibling && updateInvokerHeader.nextSibling.classList && !updateInvokerHeader.nextSibling.classList.contains('show')){
            updateInvokerHeader.click();
        }
        let that = this;
        setTimeout(function(){
            that.setState({
                isTourOpen: true,
            });
        }, 100);
    }

    /**
     * to redirect app after update
     */
    redirect(){
        this.props.router.push(`${invokerPrefixURL}`);
    }

    /**
     * to validate title
     */
    validateName(invoker){
        const {t} = this.props;
        if(invoker.name === ''){
            setFocusById('input_name');
            return {value: false, message: t('UPDATE.VALIDATION_MESSAGES.TITLE_REQUIRED')};
        }/* else {
            this.startCheckingTitle = true;
            this.props.checkConnectionTitle(connection.getObject());
            return {value: false, message: ''};
        }*/
        return {value: true, message: ''};
    }

    /**
     * to validate auth
     */
    validateAuth(invoker){
        const {t} = this.props;
        if(invoker.auth === ''){
            setFocusById('input_auth');
            return {value: false, message: t('UPDATE.VALIDATION_MESSAGES.AUTH_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    /**
     * to validate connection
     */
    validateConnection(invoker){
        const {t} = this.props;
        if(invoker.connection.name === ''){
            setFocusById('input_connection');
            return {value: false, message: t('UPDATE.VALIDATION_MESSAGES.CONNECTION_NAME_REQUIRED')};
        }
        if(invoker.connection.request.method === ''){
            setFocusById('method_post');
            return {value: false, message: t('UPDATE.VALIDATION_MESSAGES.CONNECTION_METHOD_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    render(){
        const {t, authUser, invoker, updatingInvoker, doAction} = this.props;
        let contentTranslations = {};
        contentTranslations.header = t('UPDATE.HEADER');
        contentTranslations.list_button = t('UPDATE.LIST_BUTTON');
        let changeContentTranslations = {};
        changeContentTranslations.updateButton = t('UPDATE.UPDATE_BUTTON');
        let getListLink = `${invokerPrefixURL}`;
        let breadcrumbsItems = [t('UPDATE.FORM.PAGE_1'), t('UPDATE.FORM.PAGE_2'), t('UPDATE.FORM.PAGE_3'), t('UPDATE.FORM.PAGE_4')];
        let contents = [{
            inputs: [
                {
                    ...INPUTS.INVOKER_NAME,
                    tourStep: INVOKER_TOURS.page_1[0].selector,
                    label: t('UPDATE.FORM.NAME'),
                    required: true,
                    check: (e, entity) => ::this.validateName(e, entity),
                    maxLength: 255,
                },
                {
                    ...INPUTS.INVOKER_DESCRIPTION,
                    tourStep: INVOKER_TOURS.page_1[1].selector,
                    label: t('UPDATE.FORM.DESCRIPTION'),
                },
                {
                    ...INPUTS.INVOKER_HINT,
                    tourStep: INVOKER_TOURS.page_1[2].selector,
                    label: t('UPDATE.FORM.HINT'),
                    maxLength: 255,
                },
                {
                    ...INPUTS.INVOKER_ICON,
                    tourStep: INVOKER_TOURS.page_1[3].selector,
                    label: t('UPDATE.FORM.ICON'),
                    browseTitle: t('UPDATE.FORM.ICON_PLACEHOLDER')
                },
            ],
            hint: {text: t('UPDATE.FORM.HINT_1'), openTour: ::this.openTour},
        },{
            inputs: [
                {
                    ...INPUTS.INVOKER_AUTHENTICATION,
                    tourStep: INVOKER_TOURS.page_2[0].selector,
                    label: t('UPDATE.FORM.AUTHENTICATION'),
                    required: true,
                    check: (e, entity) => ::this.validateAuth(e, entity),
                },
            ],
            hint: {text: t('UPDATE.FORM.HINT_2'), openTour: ::this.openTour},
        },{
            inputs: [
                {
                    ...INPUTS.INVOKER_CONNECTION,
                    tourSteps: INVOKER_TOURS.page_3,
                    label: t('UPDATE.FORM.CONNECTION'),
                    required: true,
                    check: (e, entity) => ::this.validateConnection(e, entity),
                    defaultValue: {name: '', path: '', method: 'post', request: {header: [], body: {}}, response: {success: {header: [], body: {}}, fail: {header: [], body: {}}}}
                },
            ],
            hint: {text: t('UPDATE.FORM.HINT_3'), openTour: ::this.openTour},
        },{
            inputs: [
                {
                    ...INPUTS.INVOKER_OPERATIONS,
                    tourSteps: INVOKER_TOURS.page_4,
                    label: t('UPDATE.FORM.OPERATIONS'),
                    required: true,
                    defaultValue: [],
                },
            ],
            hint: {text: t('UPDATE.FORM.HINT_4'), openTour: ::this.openTour},},
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
                    action={doAction}
                    entity={CInvoker.createInvoker(invoker)}
                    isActionInProcess={updatingInvoker}
                    authUser={authUser}
                    onPageSwitch={::this.setCurrentTour}
                    type={'update'}
                />
                <OCTour
                    steps={INVOKER_TOURS[this.state.currentTour]}
                    isOpen={this.state.isTourOpen}
                    onRequestClose={::this.closeTour}
                    updateDelay={1000}
                />
            </Content>
        );
    }
}

export default InvokerUpdate;