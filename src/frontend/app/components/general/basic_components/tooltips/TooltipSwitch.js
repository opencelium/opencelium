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
import {findTopLeftPosition, getThemeClass} from "@utils/app";
import theme from "react-toolbox/lib/tooltip/theme.css";
import {CustomInput} from "reactstrap";
import styles from "@themes/default/general/basic_components";
import Loading from "@components/general/app/Loading";

/**
 * Tooltip Component for FontIcon
 */
class TooltipSwitch extends Component{

    constructor(props){
        super(props);

        this.state = {
            showTooltip: false,
            left: 0,
            top: 0,
        };
        this.switch = React.createRef();
    }

    componentWillUnmount(){
        if(this.tooltip) {
            document.body.removeChild(this.tooltip);
        }
    }

    componentDidUpdate(){
        let switchElem = ReactDOM.findDOMNode(this.switch.current);
        if(switchElem) {
            let position = findTopLeftPosition(switchElem);
            let newLeft = position.left - 20;
            let newTop = position.top + (switchElem.offsetHeight / 2) - 2;
            if (this.state.left !== newLeft || this.state.top !== newTop) {
                this.setState({
                    left: newLeft,
                    top: newTop,
                })
            }
        }
    }

    show(){
        if(!this.tooltip) {
            this.tooltip = document.createElement('div');
            document.body.appendChild(this.tooltip);
        }
        this.setState({showTooltip: true});
    }

    hide(){
        if(this.tooltip) {
            document.body.removeChild(this.tooltip);
            this.tooltip = null;
        }
        this.setState({showTooltip: false});
    }

    render(){
        const {showTooltip, left, top} = this.state;
        const {authUser, tooltip, middle, tooltipPosition, wrapClassName, isLoading, ...props} = this.props;
        let position = '';
        let classNames = [
            'tooltip_switch_loading',
            'tooltip_switch',
            'tooltip',
            'switch_field',
            'switch',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        if(isLoading){
            return (
                <Loading className={styles[classNames.tooltip_switch_loading]} authUser={authUser}/>
            );
        }
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
            <span onMouseOver={::this.show} onMouseLeave={::this.hide} className={wrapClassName}>
                {showTooltip && this.tooltip && ReactDOM.createPortal(<span className={`${theme.tooltip} ${position} ${theme.tooltipActive}`} style={{left, top}}><span className={theme.tooltipInner}>{tooltip}</span></span>, this.tooltip)}
                <CustomInput type="switch" innerRef={this.switch} onFocus={::this.show} onBlur={::this.hide} {...props} className={middle ? styles[classNames.switch] : ''} />
            </span>
        );
    }
}

TooltipSwitch.propTypes = {
    authUser: PropTypes.object.isRequired,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    tooltip: PropTypes.string.isRequired,
    isLoading: PropTypes.bool,
};

TooltipSwitch.defaultProps = {
    middle: false,
    isLoading: false,
    tooltipPosition: 'top',
};

export default TooltipSwitch;