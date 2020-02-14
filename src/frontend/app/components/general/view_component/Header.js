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

import ContentHeader from '../content/ContentHeader';


/**
 * Header Component for ViewComponent
 */
class ViewHeader extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, header} = this.props;
        return (
            <ContentHeader header={header} authUser={authUser}/>
        );
    }
}

ViewHeader.propTypes = {
    authUser: PropTypes.object.isRequired,
};


export default ViewHeader;