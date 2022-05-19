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

import React, {FC, useRef, useState} from 'react';
import {withTheme} from "styled-components";
import {ColorTheme} from "@style/Theme";
import {InputFileProps} from './interfaces';
import {ButtonStyled, CheckboxStyled, FileStyled, TextStyled} from "./styles";
import Input from "../Input";
import ReactCrop from "../../crop/ReactCrop";


const InputFile: FC<InputFileProps> = ({
    value,
    placeholder,
    required,
    label,
    onChange,
    icon,
    color,
    error,
    isLoading,
    isIconInside,
    readOnly,
    id,
    hasNoImage,
    onToggleHasImage,
    hasCheckbox,
    accept,
    hasCrop,
    theme,
    showOnlyButton,
    ...props
}) => {
    const [fileName, setFileName] = useState('');
    const [src, setSrc] = useState(null);
    const inputFile = useRef(null);
    const hasIcon = !!icon;
    if(!placeholder && !fileName){
        placeholder = 'Please choose file...';
    }
    if(fileName){
        placeholder = fileName;
    }
    const hasValue = !!value;
    const textColor = hasValue || (hasNoImage && hasCheckbox) ? ColorTheme.Black : ColorTheme.Gray;
    if(hasNoImage && hasCheckbox){
        placeholder = 'Set Image';
    }
    const onChooseImage = (e: any) => {
        const f = e.target.files[0];
        if(f) {
            onChange(f);
            const reader = new FileReader();
            reader.addEventListener('load', () =>
                setSrc(reader.result)
            );
            reader.readAsDataURL(f);
            setFileName(f.name);
        } else{
            setFileName('');
            setSrc(null);
        }
    }
    const toggleImage = () => {
        if(!hasNoImage){
            setFileName('');
            setSrc(null);
        }
        onToggleHasImage(!hasNoImage);
    }
    if(showOnlyButton){
        return(
            <React.Fragment>
                <FileStyled accept={accept} hasCheckbox={false} onChange={(e) => onChooseImage(e)} ref={inputFile} tabIndex={-1} type={'file'} color={color}/>
                <ButtonStyled hasCheckbox={hasCheckbox} id={id} isLoading={!hasIcon && isLoading} emphasizeColor={color} background={theme.button.background.quite || ColorTheme.Blue} label={label} icon={'upload'} handleClick={() => {inputFile.current.click()}} position={'relative'}/>
            </React.Fragment>
        )
    }
    return(
        <Input readOnly={readOnly} value={value} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={hasIcon && isLoading} isIconInside={isIconInside}>
            {hasCheckbox && <CheckboxStyled type={'checkbox'} checked={!hasNoImage} onChange={toggleImage}/>}
            <TextStyled hasCheckbox={hasCheckbox} hasBorder={!hasNoImage && !hasValue} color={textColor} paddingLeft={hasIcon ? '30px' : '0'} value={placeholder} display={'inline-block'}/>
            {!hasNoImage && <FileStyled accept={accept} hasCheckbox={hasCheckbox} onChange={(e) => onChooseImage(e)} ref={inputFile} tabIndex={-1} type={'file'} color={color}/>}
            {hasCrop && <ReactCrop src={src} setImage={onChange}/>}
            {!hasNoImage && <ButtonStyled hasCheckbox={hasCheckbox} id={id} isLoading={!hasIcon && isLoading} emphasizeColor={color} background={theme.button.background.quite || ColorTheme.Blue} label={'Choose'} icon={'upload'} handleClick={() => {inputFile.current.click()}} position={'absolute'} right={0} top={`-5px`}/>}
        </Input>
    )
}

InputFile.defaultProps = {
    hasCrop: true,
    accept: '',
    placeholder: '',
    label: '',
    error: '',
    required: false,
    hasNoImage: true,
    hasCheckbox: false,
    showOnlyButton: false,
}

export default withTheme(InputFile);