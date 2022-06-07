/*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withTranslation} from 'react-i18next';
import { Row, Col, Visible, Hidden } from "react-grid-system";
import Table from '@entity/connection/components/components/general/basic_components/table/Table';

import SubHeader from "@entity/connection/components/components/general/view_component/SubHeader";

import styles from '@entity/connection/components/themes/default/content/my_profile/my_profile.scss';

import {Permissions} from '@entity/connection/components/utils/constants/app';
import UserGroupIcon from "@entity/connection/components/components/icons/UserGroupIcon";

/**
 * UserGroup Component of MyProfile
 */
@withTranslation(['users', 'app'])
class FormUserGroupView extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t} = this.props;
        let usergroup = this.props.entity.userGroup;
        let components = usergroup.components || [];
        return (
            <div className={styles.user_group}>
                <UserGroupIcon icon={usergroup.icon} className={styles.user_group_icon}/>
                <div>
                    <div>
                        <div className={styles.user_group_title}>
                            {usergroup.name}
                        </div>
                    </div>
                    <div className={styles.user_group_description}>
                        {usergroup.description}
                    </div>
                    <div className={styles.user_group_row_table}>
                        <div className={styles.user_group_col_table}>
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
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


export default FormUserGroupView;