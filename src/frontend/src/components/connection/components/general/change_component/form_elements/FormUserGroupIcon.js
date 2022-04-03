

/*
 * Copyright (C) <2022>  <becon GmbH>
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

import styles from '@themes/default/general/change_component.scss';
import {FormElement} from "@decorators/FormElement";
import UserPhotoIcon from "@components/icons/UserPhotoIcon";
import UserGroupIcon from "@components/icons/UserGroupIcon";

/**
 * Component for Form User Photo
 */
@FormElement()
class FormUserGroupIcon extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {icon} = this.props.entity;
        return (
            <UserGroupIcon icon={icon} className={styles.user_group_icon}/>
        );
    }
}

FormUserGroupIcon.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormUserGroupIcon;