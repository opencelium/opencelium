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
import ReactDOM from 'react-dom';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import OCFontIcon from "../FontIcon";
import {findTopLeftPosition} from "@utils/app";
import theme from "react-toolbox/lib/tooltip/theme.css";

/**
 * Tooltip Component for FontIcon
 */
class TooltipFontIcon extends Component{

    constructor(props){
        super(props);

        this.state = {
            showTooltip: false,
            left: 0,
            top: 0,
        };
        this.icon = React.createRef();
        this.tooltip = document.createElement('div');
        document.body.appendChild(this.tooltip);
    }

    componentWillUnmount(){
        document.body.removeChild(this.tooltip);
    }

    componentDidUpdate(){
        let iconElem = ReactDOM.findDOMNode(this.icon.current);
        let position = findTopLeftPosition(iconElem);
        let newLeft = position.left + (iconElem.offsetWidth / 2);
        let newTop = position.top + (iconElem.offsetHeight / 2) - 2;
        if(this.state.left !== newLeft || this.state.top !== newTop) {
            this.setState({
                left: newLeft,
                top: newTop,
            })
        }
    }

    show(){
        this.setState({showTooltip: true});
    }

    hide(){
        this.setState({showTooltip: false});
    }

    render(){
        const {showTooltip, left, top} = this.state;
        const {tooltip, tooltipPosition, ...props} = this.props;
        let position = '';
        switch (tooltipPosition) {
            case 'top':
                position = theme.tooltipTop;
                break;
            case 'left':
                position = theme.tooltipLeft;
                break;
            case 'right':
                position = theme.tooltipRight;
                break;
        }
        return (
            <span onMouseOver={::this.show} onMouseLeave={::this.hide}>
                {showTooltip && ReactDOM.createPortal(<span className={`${theme.tooltip} ${position} ${theme.tooltipActive}`} style={{left, top}}><span className={theme.tooltipInner}>{tooltip}</span></span>, this.tooltip)}
                <OCFontIcon ref={this.icon} onButtonFocus={::this.show} onButtonBlur={::this.hide} {...props}/>
            </span>
        );
    }
}

TooltipFontIcon.propTypes = {
    tooltip: PropTypes.string.isRequired,
};

TooltipFontIcon.defaultProps = {
    tooltipPosition: 'top',
};

export default TooltipFontIcon;