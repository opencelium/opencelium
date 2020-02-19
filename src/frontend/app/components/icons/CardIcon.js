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
import FontIcon from "../general/basic_components/FontIcon";
import {checkImage, getThemeClass} from "../../utils/app";
import styles from '../../themes/default/general/list_of_components.scss';


/**
 * Component for Card Icon
 */
class CardIcon extends Component{

    constructor(props){
        super(props);

        this.state = {
            isCorrectIcon: true,
        };
        this.notMounted = true;
    }

    componentDidMount(){
        const {icon} = this.props;
        checkImage(icon, () => this.setState({isCorrectIcon: true}), () => this.setState({isCorrectIcon: false}));
        this.notMounted = false;
    }

    renderIcon(){
        const {isCorrectIcon} = this.state;
        const {authUser, icon} = this.props;
        let classNames = ['avatar', 'avatar_default'];
        classNames = getThemeClass({classNames, authUser, styles});
        if(isCorrectIcon){
            return <img src={icon} className={styles[classNames.avatar]}/>;
        } else{
            return <FontIcon value={'monochrome_photos'} className={styles[classNames.avatar_default]}/>;
        }
    }

    render(){
        if(this.notMounted){
            return null;
        }
        const {isCorrectIcon} = this.state;
        const {authUser, style} = this.props;
        let classNames = ['card_avatar', 'card_avatar_default'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div className={isCorrectIcon ? styles[classNames.card_avatar] : styles[classNames.card_avatar_default]} style={style}>
                {this.renderIcon()}
            </div>
        );
    }
}

CardIcon.defaultProps = {
    authUser: PropTypes.object.isRequired,
    icon: '',
    style: {},
};

export default CardIcon;