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
import FontIcon from "@basic_components/FontIcon";
import {checkImage, getThemeClass} from "@utils/app";
import styles from '@themes/default/general/list_of_components.scss';


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

    componentDidUpdate(prevProps){
        const {icon} = this.props;
        if(prevProps.icon !== icon) {
            checkImage(icon, () => this.setState({isCorrectIcon: true}), () => this.setState({isCorrectIcon: false}));
        }
    }

    renderIcon(){
        const {isCorrectIcon} = this.state;
        const {authUser, icon, title} = this.props;
        let classNames = ['avatar', 'avatar_default'];
        classNames = getThemeClass({classNames, authUser, styles});
        if(isCorrectIcon){
            return <img src={icon} className={styles[classNames.avatar]} alt={title ? title : 'icon'}/>;
        } else{
            return <FontIcon size={'100%'} value={'monochrome_photos'} className={styles[classNames.avatar_default]}/>;
        }
    }

    render(){
        if(this.notMounted){
            return null;
        }
        const {isCorrectIcon} = this.state;
        const {authUser, style, onClick} = this.props;
        let classNames = ['card_avatar', 'card_avatar_default'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div className={isCorrectIcon ? styles[classNames.card_avatar] : styles[classNames.card_avatar_default]} style={style} onClick={onClick}>
                {this.renderIcon()}
            </div>
        );
    }
}

CardIcon.defaultProps = {
    authUser: PropTypes.object.isRequired,
    icon: '',
    style: {},
    onClick: () => {},
};

export default CardIcon;