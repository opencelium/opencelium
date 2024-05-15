/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React, {FC} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {withTheme} from 'styled-components';
import {isString} from "@application/utils/utils";
import { TextProps } from './interfaces';
import { TextStyled, LoadingStyled } from './styles';

const Text: FC<TextProps> =
    ({
        id,
        value,
        namespace,
        transKey,
        size,
        hasTitle,
        isBold,
        isLoading,
        ...styles
    }) => {
    const {t, i18n} = useTranslation();
    let textProps:any = {};
    if(id) {
        textProps.id = id;
    }
    const hasKey = !!transKey;
    let valueComponent = null;
    if(isLoading){
        return <LoadingStyled/>;
    }
    if(hasKey){
        if(i18n.exists(transKey)){
            valueComponent = t(transKey);
            if(!isString(value)){
                if(i18n.exists(`${transKey}.__DEFAULT__`)){
                    valueComponent = <Trans>{`${transKey}.__DEFAULT__`}</Trans>;
                } else{
                    valueComponent = value || <Trans>{'TRANS_KEY_NOT_EXIST'}</Trans>
                }
            }
        } else{
            valueComponent = value || <Trans>{'TRANS_KEY_NOT_EXIST'}</Trans>
        }
    }
    if(hasTitle) textProps.title = value;
    if(value === '' && valueComponent === null){
        return null;
    }
    return (
        <TextStyled {...textProps} isBold={isBold} size={size} {...styles}>
            {valueComponent || value}
        </TextStyled>
    )
}

Text.defaultProps = {
    hasTitle: false,
    value: '',
    isBold: false,
    isLoading: false,
}

export {
    Text,
};

export default withTheme(Text);
