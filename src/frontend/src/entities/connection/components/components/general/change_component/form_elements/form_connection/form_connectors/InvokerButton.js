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
import PropTypes from 'prop-types';

import styles from '@entity/connection/components/themes/default/general/change_component.scss';
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";



class InvokerButton extends Component{
    constructor(props){
        super(props);

        this.state = {
            isMouseOver: false,
        };
    }

    onMouseOver(){
        this.setState({isMouseOver: true});
    }

    onMouseLeave(){
        this.setState({isMouseOver: false});
    }

    render(){
        const {isMouseOver} = this.state;
        const {tooltip, onClick, position, isOpened} = this.props;
        let className = '';
        let tooltipPosition = 'top';
        switch (position){
            case 'left':
                className = styles.form_connector_invoker_button_from;
                if(isOpened){
                    className += ` ${styles.form_connector_invoker_opened_from}`;
                }
                tooltipPosition = 'right';
                break;
            case 'right':
                className = styles.form_connector_invoker_button_to;
                if(isOpened){
                    className += ` ${styles.form_connector_invoker_opened_to}`;
                }
                tooltipPosition = 'left';
                break;
        }
        if(isOpened){
            tooltipPosition = 'top';
        }
        return(
            <div
                className={className}
                onClick={onClick}
                onMouseOver={() => this.onMouseOver()}
                onMouseLeave={() => this.onMouseLeave()}
            >
                <TooltipFontIcon tooltip={`${tooltip} API Docs`} value={'library_books'} tooltipPosition={tooltipPosition}/>
            </div>
        );
    }
}

InvokerButton.propTypes = {
    tooltip: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    position: PropTypes.string,
    isOpened: PropTypes.bool,
};

InvokerButton.defaultProps = {
    tooltip: '',
    position: 'left',
    isOpened: false,
};

export default InvokerButton;