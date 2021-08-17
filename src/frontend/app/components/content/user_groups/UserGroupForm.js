import React from "react";
import {setFocusById} from "@utils/app";
import {INPUTS} from "@utils/constants/inputs";
import {USERGROUP_TOURS} from "@utils/constants/tours";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Form from "@change_component/Form";
import {UserGroupPermissions} from "@utils/constants/permissions";
import OCTour from "@basic_components/OCTour";

import styles from "@themes/default/content/user_groups/view.scss"

/**
 * common component to add and update User Group
 */
export function UserGroupForm(type) {
    return function (Component) {
        return class extends Component {
            constructor(props) {
                super(props);
                this.userGroupPrefixUrl = '/usergroups';
                this.translationKey = type.toUpperCase();
                this.isUpdate = type === 'update';
                this.isView = type === 'view';
                this.isAdd = type === 'add';
                this.actionName = '';
                if(this.isUpdate) this.actionName = `updatingUserGroup`;
                if(this.isAdd) this.actionName = `addingUserGroup`;
                this.state = {
                    hasPermissionsFormSection: this.isUpdate ? props.components && props.components.length > 0 : false,
                    validationMessages: {
                        role: '',
                        components: '',
                        permissions: '',
                    },
                    entity: null,
                };
            }


            componentDidMount(){
                setFocusById('input_role');
            }

            componentDidUpdate(prevProps, prevState, snapshot) {
                const {checkingUserGroupName, checkNameResult, t, checkValidationRequest} = this.props;
                checkValidationRequest(this, 'role', checkingUserGroupName, checkNameResult, t(`${this.translationKey}.VALIDATION_MESSAGES.ROLE_EXIST`));
            }

            /**
             * to clear validation message by name
             */
            clearValidationMessage(name){
                const {setValidationMessage} = this.props;
                setValidationMessage(this, name, '');
            }

            /**
             * to redirect app after add / update
             */
            redirect(){
                if(this.isUpdate) {
                    this.props.router.push(`${this.userGroupPrefixUrl}/${this.props.params.id}/view`);
                } else{
                    this.props.router.push(`${this.userGroupPrefixUrl}`);
                }
            }

            /**
             * to get components for select
             */
            matComponents(){
                const {t, components} = this.props;
                if(!components){
                    return [];
                }
                return components.map(component => {
                    return {label: t(`app:COMPONENTS.${component.name}`), value: component.id};
                });
            }

            /**
             * to show/hide permission table
             */
            togglePermissionsFormSection(components){
                this.setState({
                    hasPermissionsFormSection: components.length > 0,
                })
            }

            /**
             * to parse userGroup after fetch
             */
            parseEntity(){
                if(this.isUpdate || this.isView) {
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
                return null;
            }

            /**
             * to validate role name if empty
             */
            validateRole(entity){
                const {t, userGroup, checkUserGroupName, checkNameResult} = this.props;
                if(entity.role.trim() === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.ROLE_REQUIRED`)};
                } else{
                    if(!this.isUpdate || (this.isUpdate && userGroup.role !== entity.role)) {
                        if(!(this.state.entity && entity.role === this.state.entity.role && checkNameResult && checkNameResult.message === 'NOT_EXISTS')) {
                            checkUserGroupName(entity);
                            return {value: false, message: ''};
                        }
                    }
                }
                return {value: true, message: ''};
            }

            /**
             * to validate components if not selected
             */
            validateComponents(entity){
                const {t} = this.props;
                if(entity.components.length === 0){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.COMPONENTS_REQUIRED`)};
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
                        hasNotEmptyFields = false;
                        message = t(`${this.translationKey}.VALIDATION_MESSAGES.PERMISSIONS_REQUIRED`);
                    }
                }
                return {value: hasNotEmptyFields, message};
            }

            getIconField(){
                const {t} = this.props;
                if(this.isView){
                    return {...INPUTS.USER_GROUP_ICON, label: t(`FORM.PROFILE_PICTURE`)};
                } else{
                    return {
                        ...INPUTS.ICON, label: t(`${this.translationKey}.FORM.USER_GROUP_PICTURE`), browseTitle: t(`${this.translationKey}.FORM.USER_GROUP_PICTURE_PLACEHOLDER`),
                    };
                }
            }

            /**
             * to add/update UserGroup
             */
            doAction(entity){
                const {doAction} = this.props;
                doAction(entity, this);
            }

            render(){
                const {hasPermissionsFormSection, validationMessages} = this.state;
                const {t, checkingUserGroupName, openTour, closeTour, isTourOpen} = this.props;
                let components = this.matComponents();
                let parsedEntity = this.parseEntity();
                let contentTranslations = {};
                contentTranslations.header = {title: t(`${this.translationKey}.HEADER`), onHelpClick: openTour};
                contentTranslations.list_button = {title: t(`${this.translationKey}.LIST_BUTTON`), link: this.userGroupPrefixUrl};
                contentTranslations.action_button = this.isView ? null : {title: t(`${this.translationKey}.${this.translationKey}_BUTTON`), link: this.userGroupPrefixUrl};
                let contents = [{
                    inputs: [
                        {...INPUTS.ROLE,
                            error: validationMessages.role,
                            label: t(`${this.translationKey}.FORM.ROLE`),
                            tourStep: USERGROUP_TOURS.page_1[0].selector,
                            required: true,
                            isLoading: checkingUserGroupName === API_REQUEST_STATE.START,
                            defaultValue: '',
                            readonly: this.isView,
                            className: this.isView ? styles.role_input : '',
                        },
                        {...INPUTS.DESCRIPTION, label: t(`${this.translationKey}.FORM.DESCRIPTION`), defaultValue: '', readonly: this.isView,},
                        {...this.getIconField()}
                    ],
                    hint: {text: t(`${this.translationKey}.FORM.HINT_1`), openTour},
                    header: t(`${this.translationKey}.FORM.PAGE_1`),
                },[{
                    inputs:[
                        {...INPUTS.COMPONENTS,
                            error: validationMessages.components,
                            label: t(`${this.translationKey}.FORM.COMPONENTS`),
                            tourStep: USERGROUP_TOURS.page_1[1].selector,
                            placeholder: t(`${this.translationKey}.FORM.COMPONENTS_PLACEHOLDER`),
                            source: components,
                            required: true,
                            callback: ::this.togglePermissionsFormSection,
                            defaultValue: [],
                            readonly: this.isView,
                        },
                    ],
                    hint: {text: t(`${this.translationKey}.FORM.HINT_2`), openTour},
                    header: t(`${this.translationKey}.FORM.PAGE_2`),
                },{
                    inputs:[
                        {...INPUTS.PERMISSIONS,
                            error: validationMessages.permissions,
                            label: t(`${this.translationKey}.FORM.PERMISSIONS`),
                            tourStep: USERGROUP_TOURS.page_1[2].selector,
                            dataSource: 'components',
                            required: true,
                            defaultValue: {},
                            readonly: this.isView,
                        },
                    ],
                    hint: {text: t(`${this.translationKey}.FORM.HINT_3`), openTour},
                    header: t(`${this.translationKey}.FORM.PAGE_3`),
                    visible: hasPermissionsFormSection,
                },]
                ];
                return (
                    <div>
                        <Form
                            contents={contents}
                            translations={contentTranslations}
                            isActionInProcess={this.props[this.actionName] === API_REQUEST_STATE.START || checkingUserGroupName === API_REQUEST_STATE.START}
                            permissions={UserGroupPermissions}
                            clearValidationMessage={::this.clearValidationMessage}
                            action={::this.doAction}
                            entity={parsedEntity}
                            type={type}
                        />
                        <OCTour
                            steps={USERGROUP_TOURS.page_1}
                            isOpen={isTourOpen}
                            onRequestClose={closeTour}
                        />
                    </div>
                );
            }
        }
    }
}