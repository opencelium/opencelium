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

import {addInvoker} from '../../../../actions/invokers/add';
import {fetchInvokers} from '../../../../actions/invokers/fetch';
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
        addingInvoker: invokers.get('addingInvoker'),
        error: invokers.get('error'),
    };
}



function mapInvoker(connector){
    return {xml: connector.getXml()};
}

/**
 * Component to Add Invoker
 */
@connect(mapStateToProps, {addInvoker, fetchInvokers})
@permission(InvokerPermissions.CREATE, true)
@withTranslation(['invokers', 'app'])
@SingleComponent('invoker', 'adding', [], mapInvoker)
class InvokerAdd extends Component{

    constructor(props){
        super(props);

        const{authUser} = this.props;

        this.state = {
            invoker: CInvoker.createInvoker(null),
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
        let addInvokerHeader = document.getElementById('add_invoker_header');
        if(addInvokerHeader && addInvokerHeader.nextSibling && addInvokerHeader.nextSibling.classList && !addInvokerHeader.nextSibling.classList.contains('show')){
            addInvokerHeader.click();
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
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.TITLE_REQUIRED')};
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
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.AUTH_REQUIRED')};
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
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.CONNECTION_NAME_REQUIRED')};
        }
        if(invoker.connection.request.method === ''){
            setFocusById('method_post');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.CONNECTION_METHOD_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    render(){
        const {t, authUser, addingInvoker, doAction} = this.props;
        let {invoker} = this.state;
        let contentTranslations = {};
        contentTranslations.header = t('ADD.HEADER');
        contentTranslations.list_button = t('ADD.LIST_BUTTON');
        let changeContentTranslations = {};
        changeContentTranslations.addButton = t('ADD.ADD_BUTTON');
        let getListLink = `${invokerPrefixURL}`;
        let breadcrumbsItems = [t('ADD.FORM.PAGE_1'), t('ADD.FORM.PAGE_2'), t('ADD.FORM.PAGE_3'), t('ADD.FORM.PAGE_4')];
        let contents = [{
            inputs: [
                {
                    ...INPUTS.INVOKER_NAME,
                    tourStep: INVOKER_TOURS.page_1[0].selector,
                    label: t('ADD.FORM.NAME'),
                    required: true,
                    check: (e, entity) => ::this.validateName(e, entity),
                    maxLength: 255,
                },
                {
                    ...INPUTS.INVOKER_DESCRIPTION,
                    tourStep: INVOKER_TOURS.page_1[1].selector,
                    label: t('ADD.FORM.DESCRIPTION'),
                },
                {
                    ...INPUTS.INVOKER_HINT,
                    tourStep: INVOKER_TOURS.page_1[2].selector,
                    label: t('ADD.FORM.HINT'),
                    maxLength: 255,
                },
                {
                    ...INPUTS.INVOKER_ICON,
                    tourStep: INVOKER_TOURS.page_1[3].selector,
                    label: t('ADD.FORM.ICON'),
                    browseTitle: t('ADD.FORM.ICON_PLACEHOLDER')
                },
            ],
            hint: {text: t('ADD.FORM.HINT_1'), openTour: ::this.openTour},
        },{
            inputs: [
                {
                    ...INPUTS.INVOKER_AUTHENTICATION,
                    tourStep: INVOKER_TOURS.page_2[0].selector,
                    label: t('ADD.FORM.AUTHENTICATION'),
                    required: true,
                    check: (e, entity) => ::this.validateAuth(e, entity),
                },
            ],
            hint: {text: t('ADD.FORM.HINT_2'), openTour: ::this.openTour},
        },{
            inputs: [
                {
                    ...INPUTS.INVOKER_CONNECTION,
                    tourSteps: INVOKER_TOURS.page_3,
                    label: t('ADD.FORM.CONNECTION'),
                    required: true,
                    check: (e, entity) => ::this.validateConnection(e, entity),
                    defaultValue: {name: '', path: '', method: 'post', request: {header: [], body: {}}, response: {success: {header: [], body: {}}, fail: {header: [], body: {}}}}
                },
            ],
            hint: {text: t('ADD.FORM.HINT_3'), openTour: ::this.openTour},
        },{
            inputs: [
                {
                    ...INPUTS.INVOKER_OPERATIONS,
                    tourSteps: INVOKER_TOURS.page_4,
                    label: t('ADD.FORM.OPERATIONS'),
                    required: true,
                    defaultValue: [],
                },
            ],
            hint: {text: t('ADD.FORM.HINT_4'), openTour: ::this.openTour},},
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
                    entity={invoker}
                    isActionInProcess={addingInvoker}
                    authUser={authUser}
                    onPageSwitch={::this.setCurrentTour}
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

export default InvokerAdd;