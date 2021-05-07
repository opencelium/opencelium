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
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import styles from '@themes/default/general/basic_components.scss';
import {getThemeClass, isArray} from "@utils/app";
import TooltipFontIcon from "../tooltips/TooltipFontIcon";
import {
    FIELD_TYPE_ARRAY, FIELD_TYPE_OBJECT,
    FIELD_TYPE_STRING
} from "@classes/components/content/connection/method/CMethodItem";
import Input from "./Input";

const PARAM_DELIMITER = '.';
const MIN_SEARCH_WORD_LENGTH = 0;

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser')
    };
}

/**
 * Select Search Component
 */
@connect(mapStateToProps, {})
class SelectSearch extends Component{

    constructor(props){
        super(props);

        this.state = {
            currentItems: isArray(props.items) ? props.items : [],
            currentItem: 0,
        };
    }

    currentHoveredItem(e, key){
        this.setState({currentItem: key});
    }

    /**
     * to change input value
     */
    changeInputValue(value){
        const {onInputChange} = this.props;
        let filteredFields = this.filterFields(value);
        this.setState({currentItems: filteredFields,}, () => onInputChange(value));
    }

    /**
     * to handle press on Enter, Arrow Up and Arrow Down
     */
    onKeyDown(e){
        const {submitEdit} = this.props;
        const {currentItem, currentItems} = this.state;
        switch(e.keyCode){
            case 13:
                e.preventDefault();
                if(!e.ctrlKey) {
                    if (currentItems.length > 0) {
                        this.onSelectItem(e, currentItems[currentItem]);
                        if(currentItems.length === 1){
                            if(typeof submitEdit === 'function') {
                                submitEdit();
                            }
                        }
                    }
                } else{
                    if(typeof submitEdit === 'function') {
                        submitEdit();
                    }
                }
                break;
            case 38:
                e.preventDefault();
                if(currentItem > 0){
                    this.currentHoveredItem(e, currentItem - 1);
                }
                break;
            case 40:
                e.preventDefault();
                if(currentItem < currentItems.length - 1){
                    this.currentHoveredItem(e, currentItem + 1);
                }
                break;
        }
        if(e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey){
            if(!this.isExistInItems(e.key)){
                e.preventDefault();
            }
        }
    }

    /**
     * to clear currentItems state
     */
    onBlur(){
        if(this.state.currentItems.length !== 0) {
            this.setState({currentItems: []});
        }
        if(this.props.onBlur){
            this.props.onBlur();
        }
    }

    /**
     * to set currentItems state
     */
    onFocus(e) {
        const {id, inputValue} = this.props;
        this.setState({currentItems: this.filterFields(inputValue)});

    }

    /**
     * to select item in menu
     */
    onSelectItem(e, value){
        const {inputValue, submitEdit, id} = this.props;
        if(value){
            if(value.value !== "-1") {
                let newValue = value.value;
                let splitValue = inputValue ? inputValue.split(PARAM_DELIMITER) : [];
                if (splitValue.length > 1) {
                    splitValue[splitValue.length - 1] = value.value;
                    newValue = splitValue.join(PARAM_DELIMITER);
                }
                this.changeInputValue(newValue);
            }
            if(!(value.type !== FIELD_TYPE_ARRAY && value.type !== FIELD_TYPE_OBJECT)){
                e.preventDefault();
            }
        }
    }

    /**
     * to check if exist in items
     */
    isExistInItems(key) {
        const {inputValue, items} = this.props;
        let filteredFields = this.filterFields(`${inputValue}${key}`);
        if(items === null || inputValue.length < MIN_SEARCH_WORD_LENGTH){
            return true;
        }
        return filteredFields.length > 0;
    }

    /**
     * to filter fields
     */
    filterFields(inputValue){
        let {items, predicator, currentConnector} = this.props;
        if(inputValue.length < MIN_SEARCH_WORD_LENGTH || items === null){
            return [];
        }
        let result = items ? items.getFields(predicator !== '' ? `${predicator}.${inputValue}` : inputValue, currentConnector) : [];
        if(isArray(result) && result.length > 0) {
            result = result.map(field => {
                let {value, type} = field;
                let label = field.hasOwnProperty('label') ? field.label : field.value;
                return {label, value, type};
            });
        } else{
            result = [{label: 'No params', value: '-1', disabled: true}];
        }
        return result;
    }

    renderDropdown(){
        const {currentItems, currentItem} = this.state;
        const {authUser} = this.props;
        let classNames = [
            'select_search_dropdown',
            'items',
            'item',
            'item_hover',
        ];
        if(currentItems.length === 0){
            return null;
        }
        classNames = getThemeClass({classNames, authUser, styles});
        let itemElements = currentItems.map((value, key) => {
            return (
                <div
                    className={`${styles[classNames.item]} ${currentItem === key ? styles[classNames.item_hover] : ''}`}
                    key={key}
                    onMouseDown={(e) => ::this.onSelectItem(e, value)}
                    onMouseOver={(e) => ::this.currentHoveredItem(e, key)}
                >
                    {value.label}
                </div>
            );
        });
        return (
            <div className={styles[classNames.select_search_dropdown]}>
                <div className={styles[classNames.items]}>
                    {itemElements}
                </div>
            </div>
        );
    }

    render(){
        let {authUser, items, onInputChange, inputValue, doAction, icon, predicator, submitEdit, currentConnector, isPopupMultiline, popupRows, ...props} = this.props;
        let {theme, className, disabled, placeholder} = this.props;
        let classNames = [
            'input_input_element',
            'select_search_input',
            'select_search_button',
            'select_search_button_icon',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        let inputElement = theme && theme.hasOwnProperty('inputElement') ? theme.inputElement : styles[classNames.input_input_element];
        theme = {...theme, input: styles[classNames.select_search_input]};
        theme.inputElement = inputElement;
        if(isPopupMultiline){
            props.multiline = isPopupMultiline;
            props.rows = popupRows;
        }
        return (
            <div>
                <Input
                    {...props}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={className}
                    theme={theme}
                    onChange={::this.changeInputValue}
                    onKeyDown={::this.onKeyDown}
                    value={inputValue}
                    onBlur={::this.onBlur}
                    onFocus={::this.onFocus}
                />
                {this.renderDropdown()}
                {
                    icon !== ''
                    ?
                        <div className={`${styles[classNames.select_search_button]}`} style={{width: '20%'}}>
                            <TooltipFontIcon
                                className={styles[classNames.select_search_button_icon]}
                                style={{color: !disabled ? 'black' : 'gray'}}
                                value={'search'}
                                onClick={!disabled ? doAction : null}
                                tooltip={inputValue.length > MIN_SEARCH_WORD_LENGTH ? 'Use Param' : 'Search Param'}
                            />
                        </div>
                    :
                        null
                }
            </div>
        );
    }
}

SelectSearch.propTypes = {
    doAction: PropTypes.func,
    icon: PropTypes.string,
};

SelectSearch.defaultProps = {
    className: '',
    disabled: false,
    placeholder: '',
    icon: '',
    predicator: '',
    currentConnector: null,
    popupInputStyles: null,
    isPopupMultiline: false,
    popupRows: 1,
};

export default SelectSearch;