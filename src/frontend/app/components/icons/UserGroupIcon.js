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
import FontIcon from "../general/basic_components/FontIcon";
import {checkImage} from "../../utils/app";


/**
 * Component for UserGroup Icon
 */
class UserGroupIcon extends Component{

    constructor(props){
        super(props);

        this.state = {
            isCorrectIcon: false,
        };
    }

    componentDidMount(){
        const {icon} = this.props;
        checkImage(icon, () => this.setState({isCorrectIcon: true}), () => this.setState({isCorrectIcon: false}));
    }

    renderIcon(){
        const {isCorrectIcon} = this.state;
        const {icon, className} = this.props;
        if(isCorrectIcon){
            return <img src={icon} alt={'icon'}/>;
        } else{
            return <FontIcon value={'monochrome_photos'} className={className}/>;
        }
    }

    render(){
        return (
            <div>
                {this.renderIcon()}
            </div>
        );
    }
}

UserGroupIcon.defaultProps = {
    icon: '',
    className: '',
};

export default UserGroupIcon;