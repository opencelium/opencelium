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


/**
 * Dropdown Component
 */
class Dropdown extends Component{

    constructor(props){
        super(props);
        this.dropdownRef = React.createRef();
    }

    render(){
        const {showDropdown} = this.props;
        if(!showDropdown){
            return null;
        }
        return (
            <div style={{transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)'}} ref={this.dropdownRef} >
                {this.props.children}
            </div>
        );
    }
}

Dropdown.propTypes = {
    showDropdown: PropTypes.bool,
};

Dropdown.defaultProps = {
    showDropdown: false
};

export default Dropdown;