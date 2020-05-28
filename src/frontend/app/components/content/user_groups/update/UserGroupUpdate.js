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

import {updateUserGroup} from '@actions/usergroups/update';
import {fetchUserGroup} from '@actions/usergroups/fetch';
import {fetchComponents} from '@actions/components/fetch';
import {SingleComponent} from "@decorators/SingleComponent";
import {permission} from "@decorators/permission";
import {UserGroupPermissions} from "@utils/constants/permissions";
import {INPUTS} from "@utils/constants/inputs";
import {USERGROUP_TOURS} from "@utils/constants/tours";
import OCTour from "@basic_components/OCTour";
import {isEmptyObject, setFocusById} from "@utils/app";

const userGroupPrefixURL = '/usergroups';

function mapStateToProps(state){
    const auth = state.get('auth');
    const components = state.get('components');
    const userGroups = state.get('userGroups');
    return{
        authUser: auth.get('authUser'),
        userGroup: userGroups.get('userGroup'),
        error: userGroups.get('error'),
        fetchingUserGroup: userGroups.get('fetchingUserGroup'),
        updatingUserGroup: userGroups.get('updatingUserGroup'),
        fetchingComponents: components.get('fetchingComponents'),
        components: components.get('components').toJS(),
    };
}

function mapUserGroup(userGroup){
    let mappedUserGroup = {};
    mappedUserGroup.id = userGroup.id;
    mappedUserGroup.name = userGroup.role;
    mappedUserGroup.description = userGroup.description;
    mappedUserGroup.icon = userGroup.icon;
    mappedUserGroup.components = userGroup.components.map((component) => {
        return {componentId: component.value, permissions: userGroup.permissions[component.label]};
    });
    return mappedUserGroup;
}

/**
 * Component to Update UserGroup
 */
@connect(mapStateToProps, {fetchUserGroup, fetchComponents, updateUserGroup})
@permission(UserGroupPermissions.UPDATE, true)
@withTranslation(['userGroups', 'app'])
@SingleComponent('userGroup', 'updating', ['components'], mapUserGroup)
class UserGroupUpdate extends Component{

    constructor(props){
        super(props);

        this.state = {
            currentTour: 'page_1',
            isTourOpen: false,
        };
    }

    componentDidMount(){
        setFocusById('input_role');
    }

    /**
     * to set appropriate Tour
     */
    setCurrentTour(pageNumber){
        this.setState({
            currentTour: `page_${pageNumber}`,
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
        this.props.router.push(`${userGroupPrefixURL}/${this.props.params.id}/view`);
    }

    /**
     * to get components for select
     */
    getComponents(){
        const {t, components} = this.props;
        return components.map(component => {
            return {label: t(`app:COMPONENTS.${component.name}`), value: component.id};
        });
    }

    /**
     * to parse userGroup after fetch
     */
    parseEntity(){
        const {t, userGroup} = this.props;
        let result = {};
        result.id = userGroup.id;
        result.role = userGroup.role;
        result.description = userGroup.description;
        result.icon = userGroup.icon;
        result.permissions = {};
        result.components = [];
        userGroup.components.map(component => {
            result.components.push({label: t(`app:COMPONENTS.${component.name}`), value: component.id});
            result.permissions[t(`app:COMPONENTS.${component.name}`)] = component.permissions;
        });
        return result;
    }

    /**
     * to validate role name if empty
     */
    validateRole(entity){
        const {t} = this.props;
        if(entity.role === ''){
            setFocusById('input_role');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.ROLE_REQUIRED')};
        }
        return {value: true, message: ''};
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
        const {t, authUser, updatingUserGroup, doAction} = this.props;
        let components = this.getComponents();
        let parsedEntity = this.parseEntity();
        let getListLink = `${userGroupPrefixURL}`;
        let breadcrumbsItems = [t('UPDATE.FORM.PAGE_1'), t('UPDATE.FORM.PAGE_2'), t('UPDATE.FORM.PAGE_3')];
        let contentTranslations = {};
        let changeContentTranslations = {};
        contentTranslations.header = t('UPDATE.HEADER');
        contentTranslations.list_button = t('UPDATE.LIST_BUTTON');
        changeContentTranslations.updateButton = t('UPDATE.UPDATE_BUTTON');
        let contents = [{
            inputs: [
                {...INPUTS.ROLE,
                    tourStep: USERGROUP_TOURS.page_1[0].selector,
                    label: t('UPDATE.FORM.ROLE'),
                    required: true,
                    check: (e, entity) => ::this.validateRole(e, entity),
                },
                {...INPUTS.DESCRIPTION, label: t('UPDATE.FORM.DESCRIPTION')},
                {...INPUTS.ICON, label: t('UPDATE.FORM.USER_GROUP_PICTURE'), browseTitle: t('UPDATE.FORM.USER_GROUP_PICTURE_PLACEHOLDER')},
            ],
            hint: {text: t('UPDATE.FORM.HINT_1'), openTour: ::this.openTour},
        },{
            inputs:[
                {...INPUTS.COMPONENTS,
                    tourStep: USERGROUP_TOURS.page_2[0].selector,
                    label: t('UPDATE.FORM.COMPONENTS'),
                    placeholder: t('UPDATE.FORM.COMPONENTS_PLACEHOLDER'),
                    source: components,
                    required: true,
                    check: (e, entity) => ::this.validateComponents(e, entity),
                },
            ],
            hint: {text: t('UPDATE.FORM.HINT_2'), openTour: ::this.openTour},
        },{
            inputs:[
                {...INPUTS.PERMISSIONS,
                    tourStep: USERGROUP_TOURS.page_3[0].selector,
                    label: t('UPDATE.FORM.PERMISSIONS'),
                    dataSource: 'components',
                    required: true,
                    check: (e, entity) => ::this.validatePermissions(e, entity)
                },
            ],
            hint: {text: t('UPDATE.FORM.HINT_3'), openTour: ::this.openTour},
        },
        ];
        return (
            <Content translations={contentTranslations} getListLink={getListLink} permissions={UserGroupPermissions} authUser={authUser}>
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    action={doAction}
                    entity={parsedEntity}
                    type={'update'}
                    isActionInProcess={updatingUserGroup}
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

export default UserGroupUpdate;