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

import React, {Component, Suspense} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {Container} from 'react-grid-system';

import Loading from '@loading';
import ComponentError from "../../general/app/ComponentError";
import {ERROR_TYPE} from "@utils/constants/app";
import {UserGroupPermissions} from "@utils/constants/permissions";
import ChangeContent from "@change_component/ChangeContent";
import OCTour from "@basic_components/OCTour";
import {automaticallyShowTour, UPDATE_ASSISTANT_TOURS} from "@utils/constants/tours";
import Content from "@components/general/content/Content";
import {INPUTS} from "@utils/constants/inputs";
import SystemOverview from "@components/content/update_assistant/SystemOverview";
import AvailableUpdates from "@components/content/update_assistant/AvailableUpdates";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
    };
}

/**
 * Layout for UpdateAssistant
 */
@connect(mapStateToProps, {})
//@permission(UserGroupPermissions.CREATE, true)
@withTranslation(['update_assistant', 'app'])
class UpdateAssistantLayout extends Component{

    constructor(props){
        super(props);
        const {authUser} = this.props;
        this.state = {
            currentTour: 'page_1',
            isTourOpen: automaticallyShowTour(authUser),
        };
    }

    /**
     * to set appropriate Tour
     */
    setCurrentTour(pageNumber){
        const {authUser} = this.props;
        this.startCheckingName = false;
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
        this.setState({
            isTourOpen: true,
        });
    }

    render(){
        const {t, authUser} = this.props;
        let header = {title: t('FORM.HEADER'), breadcrumbs: [{link: '/admin_cards', text: 'Admin Cards'}],};
        let contentTranslations = {};
        contentTranslations.header = t('FORM.HEADER');
        contentTranslations.list_button = '';
        let changeContentTranslations = {};
        changeContentTranslations.addButton = '';
        let getListLink = ``;
        let breadcrumbsItems = [t('FORM.PAGE_1'), t('FORM.PAGE_2'), t('FORM.PAGE_3'), t('FORM.PAGE_4'), t('FORM.PAGE_5')];
        let contents = [{
            inputs: [
                {...INPUTS.COMPONENT, tourStep: UPDATE_ASSISTANT_TOURS.page_1[0].selector, name: 'system_check', label: t('FORM.SYSTEM_CHECK'), defaultValue: <SystemOverview/>},
            ],
            hint: {text: t('FORM.HINT_1'), openTour: ::this.openTour},
        },{
            inputs:[
                {...INPUTS.COMPONENT, tourStep: UPDATE_ASSISTANT_TOURS.page_2[0].selector, icon: 'backup', name: 'available_updates', label: t('FORM.AVAILABLE_UPDATES'), defaultValue: <AvailableUpdates/>},
            ],
            hint: {text: t('FORM.HINT_2'), openTour: ::this.openTour},
        },{
            inputs:[
            ],
            hint: {text: t('FORM.HINT_3'), openTour: ::this.openTour},
        },{
            inputs:[
            ],
            hint: {text: t('FORM.HINT_4'), openTour: ::this.openTour},
        },{
            inputs:[
            ],
            hint: {text: t('FORM.HINT_5'), openTour: ::this.openTour},
        },
        ];
        return (
            <Container>
                <Suspense fallback={(<Loading/>)}>
                    <ComponentError entity={{type: ERROR_TYPE.FRONTEND, name: this.constructor.name}}>
                        <Content translations={contentTranslations} getListLink={getListLink} permissions={UserGroupPermissions} authUser={authUser}>
                            <ChangeContent
                                breadcrumbsItems={breadcrumbsItems}
                                contents={contents}
                                translations={changeContentTranslations}
                                action={() => {}}
                                authUser={authUser}
                                onPageSwitch={::this.setCurrentTour}
                            />
                            <OCTour
                                steps={UPDATE_ASSISTANT_TOURS[this.state.currentTour]}
                                isOpen={this.state.isTourOpen}
                                onRequestClose={::this.closeTour}
                            />
                        </Content>
                    </ComponentError>
                </Suspense>
            </Container>
        );
    }
}

export default UpdateAssistantLayout;