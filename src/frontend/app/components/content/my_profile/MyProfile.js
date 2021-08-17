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

import {fetchUser} from '@actions/users/fetch';
import {SingleComponent} from "@decorators/SingleComponent";
import {permission} from "@decorators/permission";
import {MyProfilePermissions} from "@utils/constants/permissions";
import {INPUTS} from "@utils/constants/inputs";
import Form from "@change_component/Form";


function mapStateToProps(state){
    const users = state.get('users');
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
        user: users.get('user'),
        error: users.get('error'),
        fetchingUser: users.get('fetchingUser'),
    };
}

/**
 * My Profile Component
 */
@connect(mapStateToProps, {fetchUser})
@permission(MyProfilePermissions.READ)
@withTranslation('my_profile')
@SingleComponent('user')
class MyProfile extends Component{

    constructor(props){
        super(props);
    }

    /**
     * to map userGroups for select
     */
    mapUserGroups(){
        const {userGroups, t} = this.props;
        let result = {userGroups: [], descriptions: []};
        if(userGroups && userGroups.length > 0) {
            result.userGroups.push({label: t(`FORM.USER_GROUP_PLACEHOLDER`), value: 0});
            result.descriptions.push(t(`FORM.DESCRIPTION_DEFAULT`));
            userGroups.map(userGroup => {
                result.userGroups.push({label: userGroup.role, value: userGroup.id});
                result.descriptions[userGroup.id] = userGroup.description;
            });
        }
        return result;
    }

    /**
     * to parse user after fetch
     */
    parseEntity(){
        const {user} = this.props;
        let result = {};
        result.id = user.id;
        result.email = user.email;
        result.password = '';
        result.repeatPassword = '';
        result.name = user.userDetail.name;
        result.surname = user.userDetail.surname;
        result.phoneNumber = user.userDetail.phoneNumber;
        result.organisation = user.userDetail.organisation;
        result.department = user.userDetail.department;
        result.userTitle = user.userDetail.userTitle;
        result.profilePicture = user.userDetail.profilePicture;
        result.userGroup = user.userGroups;
        return result;
    }

    render(){
        const {t} = this.props;
        let contentTranslations = {};
        contentTranslations.header = {title: t(`HEADER`)};
        const parsedEntity = this.parseEntity();
        const contents = [
            {
                inputs:[
                    {...INPUTS.USER_TITLE,
                        label: t(`FORM.USER_TITLE`),
                        defaultValue: '',
                        readonly: true,
                    },
                    {...INPUTS.NAME,
                        label: t(`FORM.NAME`),
                        maxLength: 128,
                        required: true,
                        defaultValue: '',
                        readonly: true,
                    },
                    {...INPUTS.SURNAME,
                        label: t(`FORM.SURNAME`),
                        maxLength: 128,
                        required: true,
                        defaultValue: '',
                        readonly: true,
                    },
                    {...INPUTS.PHONE_NUMBER, label: t(`FORM.PHONE_NUMBER`), defaultValue: '',readonly: true,},
                    {...INPUTS.DEPARTMENT, label: t(`FORM.DEPARTMENT`), defaultValue: '',readonly: true,},
                    {...INPUTS.ORGANIZATION, label: t(`FORM.ORGANISATION`), defaultValue: '',readonly: true,},

                    {...INPUTS.EMAIL,
                        label: t(`FORM.EMAIL`),
                        maxLength: 255,
                        required: true,
                        defaultValue: '',
                        readonly: true,
                    },
                    {...INPUTS.USER_PHOTO, label: t(`FORM.PROFILE_PICTURE`),},
                ],
                hint: {text: t(`FORM.HINT_2`)},
                header: t(`FORM.PAGE_2`),
            },[
                {
                    inputs:[
                        {...INPUTS.USER_GROUP_VIEW,
                            label: t(`FORM.USER_GROUP`),
                        }
                    ],
                    hint: {text: t(`FORM.HINT_3`)},
                    header: t(`FORM.PAGE_3`),
                },
                {
                    inputs:[
                        {...INPUTS.THEMES,
                            label: t(`FORM.THEMES`),
                        },{...INPUTS.APP_TOUR,
                            label: t(`FORM.APP_TOUR`),
                        },
                    ],
                    hint: {text: t(`FORM.HINT_2`)},
                    header: t(`FORM.PAGE_3`),
                },
            ]
        ];
        return (
            <React.Fragment>
                <Form
                    contents={contents}
                    translations={contentTranslations}
                    permissions={MyProfilePermissions}
                    entity={parsedEntity}
                    type={'view'}
                />
            </React.Fragment>
        );
    }
}

export default MyProfile;