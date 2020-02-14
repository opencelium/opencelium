/*
 * Copyright (C) <2019>  <becon GmbH>
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
import {connect} from 'react-redux';
import { Row, Visible, Hidden } from "react-grid-system";

import styles from '../../../themes/default/content/my_profile/my_profile.scss';
import AvatarArea from "./AvatarArea";
import TextAreas from "./TextAreas";
import {getThemeClass} from "../../../utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}


/**
 * UserDetails Component of MyProfile
 */
@connect(mapStateToProps, {})
class UserDetails extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {user, authUser} = this.props;
        let classNames = ['user_details'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <Row className={styles[classNames.user_details]}>
                <Visible xs>
                    <AvatarArea grid={'xs'} user={user}/>
                    <TextAreas grid={'xs'} user={user}/>
                </Visible>
                <Hidden xs>
                    <TextAreas user={user}/>
                    <AvatarArea user={user}/>
                </Hidden>
            </Row>
        );
    }
}

UserDetails.propTypes = {
    user: PropTypes.object.isRequired,
};


export default UserDetails;