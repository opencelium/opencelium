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
import {fetchUserGroup} from '@actions/usergroups/fetch';
import Content from "../../../general/content/Content";
import { Row, Col, Visible, Hidden } from "react-grid-system";
import {SingleComponent} from "@decorators/SingleComponent";
import {Permissions} from '@utils/constants/app';
import styles from '@themes/default/content/user_groups/view.scss';
import {UserGroupPermissions} from '@utils/constants/permissions';
import UserGroupIcon from "../../../icons/UserGroupIcon";
import {permission} from "@decorators/permission";
import {getThemeClass} from "@utils/app";
import Table from "@basic_components/table/Table";


const prefixUrl = '/usergroups';

function mapStateToProps(state){
    const auth = state.get('auth');
    const userGroups = state.get('userGroups');
    return{
        authUser: auth.get('authUser'),
        userGroup: userGroups.get('userGroup'),
        error: userGroups.get('error'),
        fetchingUserGroup: userGroups.get('fetchingUserGroup')
    };
}

/**
 * Component to View UserGroup
 */
@connect(mapStateToProps, {fetchUserGroup})
@permission(UserGroupPermissions.READ, true)
@withTranslation(['userGroups', 'app'])
@SingleComponent('userGroup')
class UserGroupView extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, userGroup, authUser} = this.props;
        let classNames = ['user_group',
            'user_group_title_xs',
            'user_group_title',
            'user_group_icon',
            'user_group_icon_size',
            'user_group_description',
            'user_group_row_table',
            'user_group_col_table',
            'header_cell',
            'row_cell'];
        classNames = getThemeClass({classNames, authUser, styles});
        let components = userGroup.components;
        let translations = {};
        translations.header = t('VIEW.HEADER');
        translations.list_button = t('VIEW.LIST_BUTTON');
        let getListLink = `${prefixUrl}`;
        return (
            <Content translations={translations} getListLink={getListLink} permissions={UserGroupPermissions} authUser={authUser}>
                <Row className={styles[classNames.user_group]}>
                    <Col md={12}>
                        <Row>
                            <Visible xs sm>
                                <Col offset={{md: 2}} md={10} className={styles[classNames.user_group_title_xs]}>
                                    {userGroup.role}
                                </Col>
                            </Visible>
                            <Hidden xs sm>
                                <Col offset={{md: 2}} md={10} className={styles[classNames.user_group_title]}>
                                    {userGroup.role}
                                </Col>
                            </Hidden>
                        </Row>
                        <Row>
                            <Col md={2} className={styles[classNames.user_group_icon]}>
                                <UserGroupIcon icon={userGroup.icon} className={styles[classNames.user_group_icon_size]}/>
                            </Col>
                            <Col md={10} className={styles[classNames.user_group_description]}>
                                {userGroup.description}
                            </Col>
                        </Row>
                        <Row className={styles[classNames.user_group_row_table]}>
                            <Col md={12} className={styles[classNames.user_group_col_table]}>
                                <Table hover>
                                    <thead>
                                        <tr>
                                            <th>{t('VIEW.TABLE_HEAD')}</th>
                                            {Permissions.map((permission, key) => (
                                                <th key={key}>{t(`app:PERMISSIONS.${permission}`)}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {components.map((component, key) => (
                                            <tr key={key}>
                                                <td>{t(`app:COMPONENTS.${component.name}`)}</td>
                                                {
                                                    Permissions.map((permission, key2) => {
                                                        let value = '-';
                                                        if(component.permissions.indexOf(permission) !== -1){
                                                            value = '+';
                                                        }
                                                        return (
                                                            <td key={key2}>{value}</td>
                                                        );
                                                    })
                                                }
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Content>
        );
    }
}

export default UserGroupView;