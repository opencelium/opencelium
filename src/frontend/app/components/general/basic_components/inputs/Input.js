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
import {connect} from 'react-redux';
import {Input as ToolboxInput} from "react-toolbox/lib/input";
import styles from '@themes/default/general/basic_components.scss';
import {formatHtmlId, getThemeClass} from "@utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser')
    };
}

/**
 * Input Component
 */
@connect(mapStateToProps, {})
class Input extends Component{

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
     * to hide popup input on blur
     */
    onBlur(){
        const {onBlur} = this.props;
        this.hidePopupInput(onBlur);
    }

    renderPopupElement(){
        const {authUser, onChange, onBlur, isPopupInput, className, ...props} = this.props;
        let {...popupInputTheme} = this.props.theme;
        const {isVisiblePopupInput} = this.state;
        let classNames = [
            'highlighted_input_input_element',
            'popup_input',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        popupInputTheme = {...popupInputTheme, inputElement: styles[classNames.highlighted_input_input_element]};
        if(!isVisiblePopupInput){
            return null;
        }
        let fn = child =>
            React.cloneElement(child, {onBlur: ::this.onBlur, autoFocus: true, theme: {inputElement: styles[classNames.highlighted_input_input_element]}});
        let children = React.Children.map(this.props.children, fn);
        return(
            <div className={styles[classNames.popup_input]}>
                {
                    !this.props.children
                        ?
                            <ToolboxInput
                                {...props}
                                className={className}
                                theme={popupInputTheme}
                                onChange={onChange}
                                onBlur={::this.onBlur}
                                autoFocus
                            >{null}</ToolboxInput>
                        :
                        children
                }
            </div>
        );
    }

    render(){
        let {authUser, onChange, onBlur, isPopupInput, id, ...props} = this.props;
        props.id = id ? id : `input_${formatHtmlId(props.name ? props.name : props.label)}`;
        let {theme, className} = this.props;
        let classNames = [
            'input_input_element',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        let inputElement = theme && theme.hasOwnProperty('inputElement') ? theme.inputElement : styles[classNames.input_input_element];
        if(theme === null){
            theme = {};
        }
        theme.inputElement = inputElement;
        if(!isPopupInput){
            return (
                <ToolboxInput
                    {...props}
                    className={className}
                    theme={theme}
                    onClick={null}
                    onChange={onChange}
                    onBlur={onBlur}>{null}</ToolboxInput>
            );
        }
        return (
            <div style={{position: 'relative'}}>
                <ToolboxInput
                    {...props}
                    className={className}
                    theme={theme}
                    onClick={::this.showPopupInput}
                    onChange={null}
                    onBlur={null}>{null}</ToolboxInput>
                {this.renderPopupElement()}
            </div>
        );
    }
}

Input.defaultProps = {
    className: '',
    onChange: null,
    onBlur: null,
    isPopupInput: false,
    theme: null,
};

export default Input;