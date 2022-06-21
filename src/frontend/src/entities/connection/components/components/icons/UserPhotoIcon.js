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
import FontIcon from "@entity/connection/components/components/general/basic_components/FontIcon";
import {checkImage} from "@application/utils/utils";


/**
 * Component for UserPhoto Icon
 */
class UserPhotoIcon extends Component{

    constructor(props){
        super(props);

        this.state = {
            isCorrectPhoto: false,
        };
    }

    componentDidMount(){
        const {photo} = this.props;
        checkImage(photo, () => this.setState({isCorrectPhoto: true}), () => this.setState({isCorrectPhoto: false}));
    }

    renderPhoto(){
        const {isCorrectPhoto} = this.state;
        const {photo, className} = this.props;
        if(isCorrectPhoto){
            return <img src={photo} alt={'icon'}/>;
        } else{
            return <FontIcon value={'monochrome_photos'} className={className}/>;
        }
    }

    render(){
        const {className} = this.props;
        return (
            <div className={className}>
                {this.renderPhoto()}
            </div>
        );
    }
}

UserPhotoIcon.defaultProps = {
    photo: '',
    className: '',
};

export default UserPhotoIcon;