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

import React, {FC, useEffect, useRef, useState} from 'react';
import {ColorTheme} from "@style/Theme";
import {cleanString, useEventListener} from "@application/utils/utils";
import Input from "../Input";
import {InputSelectProps, OptionProps} from './interfaces';
import {
    OptionsStyled,
    SelectStyled,
    ToggleStyled,
    TextStyled,
    SearchInputStyled,
    EmptyOptionsStyled,
    MultipleValuesStyled,
    InputContainerStyled, LineStyled,
} from "./styles";
import {Option} from "./Option";
import Button from "../../button/Button";


const InputSelect: FC<InputSelectProps> = ({
    id,
    maxLength,
    value,
    placeholder,
    required,
    label,
    icon,
    color,
    error,
    isLoading,
    isIconInside,
    readOnly,
    options,
    isSearchable,
    onChange,
    isMultiple,
    className,
    getOptionRightComponent,
    maxMultiValues,
    autoFocus,
    ...props
}) => {
    let source: OptionProps[];
    source = Array.isArray(options) ? options : [];
    if(source.length === 0){
        if(options.hasOwnProperty('action') && options.hasOwnProperty('mapping')){

        }
    }
    const multipleValue = Array.isArray(value) ? value : [];
    const containerRef = useRef(null);
    const multipleRef = useRef(null);
    const inputRef = useRef(null) as React.MutableRefObject<HTMLDivElement>;
    const selectRef = useRef(null);
    const inputSelectRef = useRef(null);
    const [currentOption, setCurrentOption] = useState(value);
    const [searchValue, setSearchValue] = useState(value && !isMultiple ? value.label : '');
    const [localOptions, setLocalOptions] = useState(!isMultiple ? source : source.filter(option => multipleValue.findIndex(v => v === option.value) === -1));
    const [isToggled, toggle] = useState(false);
    const [isHidden, hide] = useState(!value);
    useEffect(() => {
        setCurrentOption(value);
        setSearchValue(value && !isMultiple ? value.label : '');
        setLocalOptions(!isMultiple ? source : source.filter(option => multipleValue.findIndex(v => v.value === option.value) === -1));
    }, [value, source])
    const checkIfClickedOutside = (e: any) => {
        if(inputRef.current !== null){
            if (isToggled && inputRef.current && !inputRef.current.contains(e.target)) {
                toggleOptions(false)
            }
        }
    }
    useEventListener('mousedown', checkIfClickedOutside, window, isToggled);
    const filterOptions = (searchValue: string) => {
        if(isMultiple){
            // @ts-ignore
            setLocalOptions(source.filter(option => multipleValue.findIndex(v => v.value === option.value) === -1 && !cleanString(option.label.toString()).indexOf(cleanString(searchValue)) !== -1));
        } else{
            setLocalOptions(source.filter(option => cleanString(option.label.toString()).indexOf(cleanString(searchValue)) !== -1));
        }
    }
    const filter = (e: any) => {
        setSearchValue(e.target.value);
        // @ts-ignore
        setLocalOptions(source.filter(option => multipleValue.findIndex(v => v.value === option.value) === -1 && cleanString(option.label.toString()).includes(cleanString(e.target.value))));
        toggle(true)
    }
    const toggleOptions = (newValue: boolean) => {
        if((!hasIcon && isLoading) || isToggled === newValue || readOnly){
            return;
        }
        if(newValue && !isMultiple){
            filterOptions('');
        }
        if(!value){
            setTimeout(() => hide(!value), 300);
        } else{
            hide(newValue);
        }
        toggle(newValue);
    }
    const setOption = (option: OptionProps) => {
        setCurrentOption(option);
        setSearchValue(isMultiple ? '' : option.label.toString());
        if(!isMultiple){
            toggleOptions(false);
        }
        if(isSearchable){
            inputSelectRef.current.focus();
        } else{
            inputSelectRef.current.nextSibling.focus();
        }
        let newValue: any;
        if(isMultiple){
            if(multipleValue.length === maxMultiValues){
                return;
            }
            newValue = [...multipleValue, option];
        } else{
            newValue = option;
        }
        onChange(newValue);
    }
    const searchInputPressed = (e: any) => {
        if(e.key === 'Backspace' && isMultiple && multipleValue.length > 0 && searchValue === ''){
            // @ts-ignore
            removeLabel( source.find(option => option.value === multipleValue[multipleValue.length - 1].value).label);
        }
        if(e.key === 'Enter' && localOptions.length > 0){
            setOption( localOptions[0]);
        }
        if(e.key === 'Escape'){
            toggleOptions(false);
            inputSelectRef.current.parentElement.parentElement.nextSibling.focus();
        }
        if(e.keyCode === 40){
            e.currentTarget.parentElement.parentElement.nextSibling.nextSibling.nextSibling.querySelector('input').focus();
        }
    }
    const focusNextOption = (e: any, option: OptionProps) => {
        if(e.keyCode === 38){
            let prevElement = e.currentTarget.previousSibling
            if(prevElement && prevElement.tagName.toLowerCase() == "input"){
                e.preventDefault();
                prevElement.focus();
            }
        }
        if(e.keyCode === 40){
            let nextElement = e.currentTarget.nextSibling;
            if(nextElement && nextElement.tagName.toLowerCase() == "input"){
                e.preventDefault();
                nextElement.focus();
            }
        }
        if(e.code === 'Escape'){
            toggleOptions(false);
            inputSelectRef.current.parentElement.parentElement.nextSibling.focus();
        }
        if(e.code === 'Enter') setOption(option);
    }
    const toggleRemoveLabel = (e: any) => {
        if(!inputRef.current.contains(e.relatedTarget)){
            toggleOptions(false);
        }
    }
    const removeLabel = (label: string) => {
        let labelValue = source.find(option => option.label === label).value;
        // @ts-ignore
        value = multipleValue.filter(v => v.value !== labelValue);
        onChange(value);
        if(multipleRef.current){
            let allLabels = multipleRef.current.children;
            if(allLabels.length > 2){
                let closeButton = allLabels[allLabels.length - 3].querySelector('button');
                if(closeButton){
                    closeButton.focus();
                }
            } else if(allLabels.length === 2){
                allLabels[allLabels.length - 1].focus();
            }
        }
        // @ts-ignore
        setLocalOptions(source.filter(option => multipleValue.findIndex(v => v.value === option.value && v.value !== labelValue) === -1));
    }
    const hasIcon = !!icon;
    let height = isToggled ? (localOptions.length > 0 ? localOptions.length : 1) * 34 + 1 : 0;
    let multipleLabels = [];
    let hasValue = !!value;
    if(isMultiple){
        if(multipleValue.length === 0){
            hasValue = false;
        }
        if(source.length > 0) {
            for (let i = 0; i < multipleValue.length; i++) {
                // @ts-ignore
                let newLabel = source.find(option => option.value === multipleValue[i].value);
                if(newLabel){
                    multipleLabels.push(newLabel.label);
                }
            }
        }
    }
    const searchPlaceholder = !!placeholder ? placeholder : "Please type to search...";
    const hasSearchInput = isSearchable && (!readOnly || !isMultiple);
    return(
        <Input className={className} paddingLeft={hasIcon && isIconInside ? '30px' : '0'} componentRef={inputRef} noIcon={!hasIcon} hasUnderline={false} readOnly={readOnly} maxLength={maxLength} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <InputContainerStyled hasBorder={!hasValue && !isToggled} ref={containerRef} color={currentOption ? ColorTheme.Black : ColorTheme.Gray}>
                <MultipleValuesStyled ref={multipleRef}>
                    {
                        isMultiple && multipleLabels.map((label, index) => {
                            return (
                                <span key={`${label}_${index}`}>
                                    {label}
                                    {!readOnly && <Button hasBackground={false} icon={'close'} onBlur={toggleRemoveLabel} handleClick={() => removeLabel(label)} color={ColorTheme.Black} iconSize={'10px'} position={'absolute'} right={0} top={0}/>}
                                </span>
                            );
                        })
                    }
                    {
                        hasSearchInput &&
                        <SearchInputStyled
                            id={id}
                            autoFocus={autoFocus}
                            readOnly={readOnly}
                            placeholder={searchPlaceholder}
                            onKeyDown={searchInputPressed}
                            ref={inputSelectRef}
                            onFocus={() => toggleOptions(true)}
                            onClick={() => toggleOptions(true)}
                            value={searchValue} onChange={filter}/>
                    }
                </MultipleValuesStyled>
                {
                    !isSearchable &&
                        <TextStyled
                            readOnly={readOnly}
                            value={currentOption ? currentOption.label : placeholder}
                            display={'inline-block'}
                        />
                }
            </InputContainerStyled>
            {!isSearchable && <SelectStyled id={id} ref={inputSelectRef} tabIndex={-1} color={color} onClick={() => toggleOptions(isToggled)}/>}
            {!readOnly && <ToggleStyled noAnimation={isHidden} hasNotUnderline={isHidden} hasBackground={false} isLoading={!hasIcon && isLoading} emphasizeColor={color} size={16} color={ColorTheme.ToolboxBlue} icon={isToggled ? 'arrow_drop_up' : 'arrow_drop_down'} handleClick={() => toggleOptions(!isToggled)} position={'absolute'} right={1} top={`5px`}/>}
            <LineStyled/>
            <OptionsStyled ref={selectRef} isVisible={isHidden} height={height} color={ColorTheme.DarkBlue}>
                {
                    localOptions.length > 0 ? localOptions.map((option, key) => {
                        return (
                            <Option key={option.value}
                                onKeyDown={(e: any) => focusNextOption(e, option)}
                                isCurrent={isMultiple ? false : currentOption && option.value === currentOption.value || option.value === searchValue}
                                tabIndex={isToggled ? 0 : -1}
                                onClick={() => setOption(option)}
                                {...option}
                                value={option.label}
                                getOptionRightComponent={getOptionRightComponent}
                            />
                        );
                    }) : <EmptyOptionsStyled>{'There are no options'}</EmptyOptionsStyled>
                }
            </OptionsStyled>
        </Input>
    );
}

InputSelect.defaultProps = {
    placeholder: '',
    label: '',
    error: '',
    required: false,
    readOnly: false,
    options: [],
    isSearchable: true,
    isMultiple: false,
    callback: null,
    className: '',
    getOptionRightComponent: null,
    maxMultiValues: Infinity,
    autoFocus: false,
}

export default InputSelect;