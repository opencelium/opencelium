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

import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import {FormElement} from "@entity/connection/components/decorators/FormElement";
import UserPhotoIcon from "@entity/connection/components/components/icons/UserPhotoIcon";

/**
 * Component for Form User Photo
 */
@FormElement()
class FormUserPhoto extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {profilePicture} = this.props.entity;
        return (
            <UserPhotoIcon photo={profilePicture} className={styles.user_photo}/>
        );
    }
}

FormUserPhoto.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormUserPhoto;