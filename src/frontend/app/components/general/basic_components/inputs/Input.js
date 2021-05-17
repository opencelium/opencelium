/*
 * Copyright (C) <2021>  <becon GmbH>
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
import {formatHtmlId, getThemeClass, setFocusById} from "@utils/app";
import CVoiceControl from "@classes/voice_control/CVoiceControl";

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

    componentDidMount(){
        let {id, name, label, hasFocus} = this.props;
        if(hasFocus) {
            id = id ? id : `input_${formatHtmlId(name ? name : label)}`;
            setFocusById(id);
        }
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
    onBlur(e){
        const {isVisiblePopupInput} = this.state;
        const {onBlur} = this.props;
        if(isVisiblePopupInput) {
            this.hidePopupInput(onBlur);
        } else{
            if(typeof onBlur === 'function'){
                onBlur(e);
            }
        }
        CVoiceControl.stopVoiceInput();
    }

    onFocus(e){
        const {onFocus, value, onChange} = this.props;
        if(typeof onFocus === 'function'){
            onFocus(e);
        }
        CVoiceControl.initVoiceInput(value, onChange);
    }

    renderPopupElement(){
        const {authUser, onChange, onBlur, isPopupInput, className, popupInputStyles, isPopupMultiline, popupRows, ...props} = this.props;
        let {...popupInputTheme} = this.props.theme;
        const {isVisiblePopupInput} = this.state;
        let classNames = [
            'highlighted_input_input_element',
            'popup_input',
            'input_bar',
            'input_icon',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        popupInputTheme = {...popupInputTheme, inputElement: styles[classNames.highlighted_input_input_element], bar: styles[classNames.input_bar], icon: styles[classNames.input_icon]};
        if(!isVisiblePopupInput){
            return null;
        }
        let fn = child =>
            React.cloneElement(child, {onBlur: ::this.onBlur, autoFocus: true, theme: {inputElement: styles[classNames.highlighted_input_input_element], bar: styles[classNames.input_bar], icon: styles[classNames.input_icon]}});
        let children = React.Children.map(this.props.children, fn);
        return(
            <div className={styles[classNames.popup_input]} style={popupInputStyles}>
                {
                    !this.props.children
                        ?
                            <ToolboxInput
                                {...props}
                                multiline={isPopupMultiline}
                                rows={popupRows}
                                className={className}
                                theme={popupInputTheme}
                                onChange={onChange}
                                onBlur={::this.onBlur}
                                onKeyDown={::this.onKeyDown}
                                autoFocus
                                onFocus={::this.onFocus}
                            >{null}</ToolboxInput>
                        :
                        children
                }
            </div>
        );
    }

    render(){
        let {authUser, onChange, onBlur, isPopupInput, id, hasFocus, popupInputStyles, isPopupMultiline, popupRows, ...props} = this.props;
        props.id = id ? id : `input_${formatHtmlId(props.name ? props.name : props.label)}`;
        let {theme, className} = this.props;
        let classNames = [
            'input_input_element',
            'input_bar',
            'input_icon',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        let inputElement = theme && theme.hasOwnProperty('inputElement') ? theme.inputElement : styles[classNames.input_input_element];
        let bar = theme && theme.hasOwnProperty('bar') ? theme.bar : styles[classNames.input_bar];
        let icon = theme && theme.hasOwnProperty('icon') ? theme.icon : styles[classNames.input_icon];
        if(theme === null){
            theme = {};
        }
        theme.inputElement = inputElement;
        theme.bar = bar;
        theme.icon = icon;
        if(!isPopupInput){
            return (
                <ToolboxInput
                    {...props}
                    className={className}
                    theme={theme}
                    onClick={null}
                    onChange={onChange}
                    onBlur={::this.onBlur}
                    onFocus={::this.onFocus}
                >{null}
                </ToolboxInput>
            );
        }
        return (
            <div style={{position: 'relative'}}>
                <ToolboxInput
                    {...props}
                    className={className}
                    theme={theme}
                    onClick={::this.showPopupInput}
                    onFocus={::this.showPopupInput}
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
    hasFocus: false,
    popupInputStyles: null,
    isPopupMultiline: false,
    popupRows: 1,
};

export default Input;