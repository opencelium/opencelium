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

import theme from "react-toolbox/lib/tooltip/theme.css";
import {getThemeClass} from "../../../../utils/app";
import styles from '../../../../themes/default/general/basic_components.scss';


/**
 * Tooltip Component for Text
 */
class TooltipText extends Component{

    constructor(props){
        super(props);
        this.state = {
            isActive: false,
        };
    }

    activate(){
        this.setState({
            isActive: true,
        });
    }

    deactivate(){
        this.setState({
            isActive: false,
        });
    }

    render(){
        const {authUser, tooltip, text, className} = this.props;
        let classNames = [
            'tooltip_switch',
            'tooltip',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <span className={`${styles[classNames.tooltip_switch]} ${className}`} onMouseOver={::this.activate} onMouseLeave={::this.deactivate}>
                <span className={`${theme.tooltip} ${theme.tooltipTop} ${ this.state.isActive ? theme.tooltipActive : ''} ${styles[classNames.tooltip]}`}>
                    <span className={`${theme.tooltipInner}`}>{tooltip}</span>
                </span>
                <span>{text}</span>
            </span>
        );
    }
}

TooltipText.propTypes = {
    authUser: PropTypes.object.isRequired,
    tooltip: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
};
TooltipText.defaultProps = {
    className: '',
};

export default TooltipText;