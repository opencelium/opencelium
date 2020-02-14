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
import {connect} from 'react-redux';
import {permission} from "../../../decorators/permission";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}


/**
 * Button Component for Card
 */
@connect(mapStateToProps, {})
@permission()
class CardButton extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {className, onClick, text} = this.props;
        return (
            <div className={className} onClick={onClick}>{text}</div>
        );
    }
}

CardButton.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    text: PropTypes.string.isRequired,
};

CardButton.defaultProps = {
    className: '',
    onClick: null,
};

export default CardButton;