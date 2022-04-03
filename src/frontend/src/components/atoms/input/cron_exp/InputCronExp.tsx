/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React, {FC} from 'react';
import {CronExpInputProps} from './interfaces';
import {InputCronExpStyled} from "./styles";
import Input from "../Input";
import CronGenerator from "@atom/input/cron_exp/CronGenerator";


const InputCronExp: FC<CronExpInputProps> = ({
       maxLength,
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
       type,
       hasUnderline,
       display,
       width,
       marginLeft,
       minHeight,
       background,
       marginTop,
       paddingTop,
       paddingLeftInput,
       paddingRightInput,
       height,
       overflow,
       inputHeight,
       isVisible,
       ...props
    }) => {
    if(!isVisible){
        return null;
    }
    return(
        <Input overflow={overflow} height={height} paddingTop={paddingTop} marginTop={marginTop} background={background} minHeight={minHeight} marginLeft={marginLeft} width={width}
               display={display} hasUnderline={hasUnderline} readOnly={readOnly} value={value} maxLength={maxLength} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <CronGenerator changeCronExp={onChange}/>
            <InputCronExpStyled
                emphasizeColor={color}
                maxLength={maxLength}
                value={value}
                onChange={(e: any) => onChange(e.target.value)}
                readOnly={readOnly}
                width={width}
                marginLeft={marginLeft}
                background={background}
                marginTop={marginTop}
                paddingLeftInput={paddingLeftInput}
                paddingRightInput={paddingRightInput}
                height={inputHeight ? inputHeight : height}
                {...props}
            />
        </Input>
    );
}

InputCronExp.defaultProps = {
    maxLength: Infinity,
    placeholder: '',
    label: '',
    error: '',
    required: false,
    readOnly: false,
    background: 'unset',
    inputHeight: 'unset',
    isVisible: true,
}

export default InputCronExp;