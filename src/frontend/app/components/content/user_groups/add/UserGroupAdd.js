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

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import Content from "../../../general/content/Content";
import ChangeContent from "@change_component/ChangeContent";

import {addUserGroup} from '@actions/usergroups/add';
import {checkUserGroupName} from "@actions/usergroups/fetch";
import {fetchComponents} from '@actions/components/fetch';
import {permission} from "@decorators/permission";
import {UserGroupPermissions} from "@utils/constants/permissions";
import {INPUTS} from "@utils/constants/inputs";
import {automaticallyShowTour, USERGROUP_TOURS} from "@utils/constants/tours";
import OCTour from "@basic_components/OCTour";
import {SingleComponent} from "@decorators/SingleComponent";
import {setFocusById} from "@utils/app";

const userGroupPrefixURL = '/usergroups';


/**
 * to add usergroup
 */
function mapUserGroup(userGroup){
    let mappedUserGroup = {};
    mappedUserGroup.name = userGroup.role;
    mappedUserGroup.description = userGroup.description;
    mappedUserGroup.icon = userGroup.icon;
    mappedUserGroup.components = userGroup.components.map((component) => {
        return {componentId: component.value, permissions: userGroup.permissions[component.label]};
    });
    return mappedUserGroup;
}

function mapStateToProps(state){
    const auth = state.get('auth');
    const userGroups = state.get('userGroups');
    const components = state.get('components');
    return{
        authUser: auth.get('authUser'),
        addingUserGroup: userGroups.get('addingUserGroup'),
        error: userGroups.get('error'),
        checkingUserGroupName: userGroups.get('checkingUserGroupName'),
        checkNameResult: userGroups.get('checkNameResult'),
        fetchingComponents: components.get('fetchingComponents'),
        components: components.get('components').toJS(),
    };
}

/**
 * Component to Add User Group
 */
@connect(mapStateToProps, {addUserGroup, fetchComponents, checkUserGroupName})
@permission(UserGroupPermissions.CREATE, true)
@withTranslation(['userGroups', 'app'])
@SingleComponent('userGroup', 'adding', ['components'], mapUserGroup)
class UserGroupAdd extends Component{

    constructor(props){
        super(props);

        const {authUser} = this.props;
        this.startCheckingName = false;
        this.state = {
            currentTour: 'page_1',
            isTourOpen: automaticallyShowTour(authUser),
        };
    }

    componentDidMount(){
        setFocusById('input_role');
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

    /**
     * to redirect app after add
     */
    redirect(){
        this.props.router.push(`${userGroupPrefixURL}`);
    }

    /**
     * to map components for select
     */
    mapComponents(){
        const {components, t} = this.props;
        return components.map(component => {
            return {label: t(`app:COMPONENTS.${component.name}`), value: component.id};
        });
    }

    /**
     * to validate role name if empty
     */
    validateRole(entity){
        const {t, checkUserGroupName} = this.props;
        if(entity.role === ''){
            setFocusById('input_role');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.ROLE_REQUIRED')};
        } else{
            this.startCheckingName = true;
            checkUserGroupName(entity);
            return {value: false, message: ''};
        }
    }

    /**
     * to validate components if not selected
     */
    validateComponents(entity){
        const {t} = this.props;
        if(entity.components.length === 0){
            setFocusById('input_components');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.COMPONENTS_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    /**
     * to validate permissions on empty fields
     */
    validatePermissions(entity){
        const {t} = this.props;
        let components = entity['components'];
        let permissions = entity['permissions'];
        let hasNotEmptyFields = true;
        let message = '';
        for(let i = 0; i < components.length; i++){
            if(!permissions.hasOwnProperty(components[i].label) || permissions[components[i].label].length === 0){
                setFocusById('input_permissions');
                hasNotEmptyFields = false;
                message = t('UPDATE.VALIDATION_MESSAGES.PERMISSIONS_REQUIRED');
            }
        }
        return {value: hasNotEmptyFields, message};
    }

    render(){
        const {t, authUser, addingUserGroup, doAction, checkingUserGroupName, checkNameResult} = this.props;
        let mappedComponents = this.mapComponents();
        let contentTranslations = {};
        contentTranslations.header = t('ADD.HEADER');
        contentTranslations.list_button = t('ADD.LIST_BUTTON');
        let changeContentTranslations = {};
        changeContentTranslations.addButton = t('ADD.ADD_BUTTON');
        let getListLink = `${userGroupPrefixURL}`;
        let breadcrumbsItems = [t('ADD.FORM.PAGE_1'), t('ADD.FORM.PAGE_2'), t('ADD.FORM.PAGE_3')];
        let contents = [{
            inputs: [
                {...INPUTS.ROLE,
                    label: t('ADD.FORM.ROLE'),
                    tourStep: USERGROUP_TOURS.page_1[0].selector,
                    defaultValue: '',
                    required: true,
                    check: (e, entity) => ::this.validateRole(e, entity),
                    request: {
                        inProcess: checkingUserGroupName,
                        status: this.startCheckingName && !checkingUserGroupName,
                        result: checkNameResult,
                        notSuccessMessage: t('ADD.VALIDATION_MESSAGES.ROLE_EXIST'),
                    },
                },
                {...INPUTS.DESCRIPTION, label: t('ADD.FORM.DESCRIPTION'), defaultValue: ''},
                {...INPUTS.ICON, label: t('ADD.FORM.USER_GROUP_PICTURE'), browseTitle: t('ADD.FORM.USER_GROUP_PICTURE_PLACEHOLDER')},
            ],
            hint: {text: t('ADD.FORM.HINT_1'), openTour: ::this.openTour},
        },{
            inputs:[
                {...INPUTS.COMPONENTS,
                    label: t('ADD.FORM.COMPONENTS'),
                    tourStep: USERGROUP_TOURS.page_2[0].selector,
                    placeholder: t('ADD.FORM.COMPONENTS_PLACEHOLDER'),
                    source: mappedComponents,
                    defaultValue: [],
                    required: true,
                    check: (e, entity) => ::this.validateComponents(e, entity),
                },
            ],
            hint: {text: t('ADD.FORM.HINT_2'), openTour: ::this.openTour},
        },{
            inputs:[
                {...INPUTS.PERMISSIONS,
                    label: t('ADD.FORM.PERMISSIONS'),
                    tourStep: USERGROUP_TOURS.page_3[0].selector,
                    dataSource: 'components',
                    defaultValue: {},
                    required: true,
                    check: (e, entity) => ::this.validatePermissions(e, entity),
                },
            ],
            hint: {text: t('ADD.FORM.HINT_3'), openTour: ::this.openTour},
        },
        ];
        return (
            <Content translations={contentTranslations} getListLink={getListLink} permissions={UserGroupPermissions} authUser={authUser}>
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    action={doAction}
                    isActionInProcess={addingUserGroup}
                    authUser={authUser}
                    onPageSwitch={::this.setCurrentTour}
                />
                <OCTour
                    steps={USERGROUP_TOURS[this.state.currentTour]}
                    isOpen={this.state.isTourOpen}
                    onRequestClose={::this.closeTour}
                />
            </Content>
        );
    }
}

export default UserGroupAdd;