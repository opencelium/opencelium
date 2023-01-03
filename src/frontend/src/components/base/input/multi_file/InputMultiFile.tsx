/*
 *  Copyright (C) <2023> <becon GmbH>
 *
 *  Licensed under the Apache License, Version 2.0 (the „License");
 *  you may not #use this file except in compliance with the License.
 *  You may obtain a copy #of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an „AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import React, {FC, useRef, useState} from 'react';
import {withTheme} from "styled-components";
import {ColorTheme} from "@style/Theme";
import {InputMultiFileProps} from './interfaces';
import {
    ButtonStyled,
    CheckboxStyled,
    ChosenFilesStyled, DeleteIconStyled,
    FileStyled,
    OnlyButtonStyled, OnlyChosenFilesStyled,
    OnlyFileStyled,
    TextStyled
} from "./styles";
import Input from "../Input";
import {TextSize} from "@app_component/base/text/interfaces";


const InputMultiFile: FC<InputMultiFileProps> = ({
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
    setFiles,
    files,
    marginBottom,
    marginTop,
    max,
    ...props
}) => {
    const [localError, setLocalError] = useState<string>('');
    const inputFile = useRef(null);
    const hasIcon = !!icon;
    if(!placeholder){
        placeholder = 'Please choose file...';
    }
    const hasValue = !!value;
    const textColor = hasValue || (hasNoImage && hasCheckbox) ? ColorTheme.Black : ColorTheme.Gray;
    const onChooseImage = (e: any) => {
        const f = e.target.files;
        if(files.length + f.length > max){
            setLocalError(`You can attach maximum ${max} files`);
        } else{
            setLocalError('');
            if(f) {
                setFiles([...files, ...f]);
            }
        }
    }
    if(showOnlyButton){
        return(
            <React.Fragment>
                <OnlyFileStyled multiple accept={accept} hasCheckbox={false} onChange={(e) => onChooseImage(e)} ref={inputFile} tabIndex={-1} type={'file'} color={color}/>
                <OnlyButtonStyled hasCheckbox={hasCheckbox} id={id} isLoading={!hasIcon && isLoading} emphasizeColor={color} background={theme.button.background.quite || ColorTheme.Blue} label={label} icon={icon} handleClick={() => {inputFile.current.click()}} position={'relative'}/>
                {files.length > 0 && <OnlyChosenFilesStyled>
                    {files.map((file: any) => {
                        return <div key={file.name}>{file.name}<DeleteIconStyled name={'delete'} size={TextSize.Size_16} onClick={() => {setFiles(files.filter(localFile => localFile.name !== file.name))}}/></div>
                    })}
                </OnlyChosenFilesStyled>}
            </React.Fragment>
        )
    }
    return(
        <Input marginTop={marginTop} marginBottom={marginBottom} readOnly={readOnly} value={value} placeholder={placeholder} required={required} label={label} icon={icon} error={localError || error} isLoading={hasIcon && isLoading} isIconInside={isIconInside}>
            <TextStyled hasCheckbox={hasCheckbox} hasBorder={!hasNoImage && !hasValue} color={textColor} paddingLeft={hasIcon ? '30px' : '0'} value={placeholder} display={'inline-block'}/>
            <FileStyled multiple accept={accept} hasCheckbox={hasCheckbox} onChange={(e) => onChooseImage(e)} ref={inputFile} tabIndex={-1} type={'file'} color={color}/>
            <ButtonStyled hasCheckbox={hasCheckbox} id={id} isLoading={!hasIcon && isLoading} emphasizeColor={color} background={theme.button.background.quite || ColorTheme.Blue} label={'Choose'} icon={'upload'} handleClick={() => {inputFile.current.click()}} position={'absolute'} right={0} top={`-5px`}/>
            <ChosenFilesStyled>
                {files.map((file: any, key: number) => {
                    return (
                        <div>
                            <div key={file.name}>
                                {file.name}
                                <DeleteIconStyled name={'delete'} size={TextSize.Size_16} onClick={() => {setFiles(files.filter(localFile => localFile.name !== file.name))}}/>
                            </div>
                        </div>
                    );
                })}
            </ChosenFilesStyled>
        </Input>
    )
}

InputMultiFile.defaultProps = {
    hasCrop: true,
    accept: '',
    placeholder: '',
    label: '',
    error: '',
    required: false,
    hasNoImage: true,
    hasCheckbox: false,
    showOnlyButton: false,
    marginBottom: 0,
    max: Infinity,
}

export default withTheme(InputMultiFile);