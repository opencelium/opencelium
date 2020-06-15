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
import styles from '@themes/default/general/basic_components.scss';
import {getThemeClass} from "@utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser')
    };
}


/**
 * Component for PopupText
 */
@connect(mapStateToProps, {})
class PopupText extends Component{

    constructor(props){
        super(props);

        this.state = {
            isVisiblePopupInput: false,
        };
    }

    /**
     * to show popup input
     */
    showPopupInput(){
        this.setState({isVisiblePopupInput: true});
    }

    /**
     * to hide popup input
     */
    hidePopupInput(callback = null){
        this.setState({isVisiblePopupInput: false}, callback);
    }

    /**
     * to hide popup input
     */
    onMouseLeave(){
        this.hidePopupInput();
    }

    render(){
        const {isVisiblePopupInput} = this.state;
        const {authUser, text, popupText, className} = this.props;
        let classNames = [
            'input_input_element',
            'highlighted_input_input_element',
            'popup_text',
            'popup_text_popup',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        let popupTextClassname = className ? `${className} ${styles[classNames.popup_text]}` : styles[classNames.popup_text];
        return (
            <div
                className={popupTextClassname}
                onClick={::this.showPopupInput}
            >
                <span>{text}</span>
                {
                    isVisiblePopupInput
                        ?
                        <div
                            className={styles[classNames.popup_text_popup]}
                            onMouseLeave={::this.onMouseLeave}
                        >
                            <span>{popupText}</span>
                        </div>
                        :
                        null
                }
            </div>
        );
    }
}

PopupText.propTypes = {
    text: PropTypes.string.isRequired,
    popupText: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default PopupText;