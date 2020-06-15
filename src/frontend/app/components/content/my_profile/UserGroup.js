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
import PropTypes from 'prop-types';
import {withTranslation} from 'react-i18next';
import { Row, Col, Visible, Hidden } from "react-grid-system";
import Table from '@basic_components/table/Table';
import {TableHead, TableRow, TableCell} from 'react-toolbox/lib/table';

import SubHeader from "../../general/view_component/SubHeader";

import styles from '@themes/default/content/my_profile/my_profile.scss';

import {Permissions} from '@utils/constants/app';
import UserGroupIcon from "../../icons/UserGroupIcon";
import {connect} from "react-redux";
import {getThemeClass} from "@utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}


/**
 * UserGroup Component of MyProfile
 */
@connect(mapStateToProps, {})
@withTranslation(['users', 'app'])
class UserGroup extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, authUser} = this.props;
        let classNames = ['user_group',
            'user_group_title_xs',
            'user_group_title',
            'user_group_icon',
            'user_group_icon_size',
            'user_group_description',
            'user_group_row_table',
            'user_group_col_table',
            'user_group_table',
            'header_cell',
            'row_cell'];
        classNames = getThemeClass({classNames, authUser, styles});
        let {usergroup} = this.props;
        let components = usergroup.components;
        return (
            <Row className={styles[classNames.user_group]}>
                <Col md={12}>
                    <SubHeader title={t('VIEW.USER_GROUP')} authUser={authUser}/>
                    <Row>
                        <Visible xs sm>
                            <Col offset={{md: 2}} md={10} className={styles[classNames.user_group_title_xs]}>
                                {usergroup.role}
                            </Col>
                        </Visible>
                        <Hidden xs sm>
                            <Col offset={{md: 2}} md={10} className={styles[classNames.user_group_title]}>
                                {usergroup.role}
                            </Col>
                        </Hidden>
                    </Row>
                    <Row>
                        <Col md={2} className={styles[classNames.user_group_icon]}>
                            <UserGroupIcon icon={usergroup.icon} className={styles[classNames.user_group_icon_size]}/>
                        </Col>
                        <Col md={10} className={styles[classNames.user_group_description]}>
                            {usergroup.description}
                        </Col>
                        </Row>
                    <Row className={styles[classNames.user_group_row_table]}>
                        <Col md={12} className={styles[classNames.user_group_col_table]}>
                            <Table authUser={authUser} selectable={false} className={styles[classNames.user_group_table]}>
                                <TableHead>
                                    <TableCell>{t('VIEW.TABLE_HEAD')}</TableCell>
                                    {Permissions.map((permission, key) => (
                                        <TableCell key={key} className={styles[classNames.header_cell]}>{t(`app:PERMISSIONS.${permission}`)}</TableCell>
                                    ))}
                                </TableHead>
                                {components.map((component, key) => (
                                    <TableRow key={key}>
                                        <TableCell>{t(`app:COMPONENTS.${component.name}`)}</TableCell>
                                        {
                                            Permissions.map((permission, key2) => {
                                                let value = '-';
                                                if(component.permissions.indexOf(permission) !== -1){
                                                    value = '+';
                                                }
                                                return (
                                                    <TableCell key={key2} className={styles[classNames.row_cell]}>{value}</TableCell>
                                                );
                                            })
                                        }
                                    </TableRow>
                                ))}
                            </Table>
                        </Col>
                    </Row>
                </Col>
            </Row>
        );
    }
}

UserGroup.propTypes = {
    usergroup: PropTypes.object.isRequired,
};


export default UserGroup;