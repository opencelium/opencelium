import React, {FC} from 'react';
import { Trans } from 'react-i18next';
import {withTheme} from 'styled-components';
import { TextProps } from './interfaces';
import { TextStyled } from './styles';
import i18next from "i18next";
import {isString} from "../../utils";
import {useTranslation} from "react-i18next";

const Text: FC<TextProps> =
    ({
        value,
        namespace,
        transKey,
        size,
        hasTitle,
        isBold,
        ...styles
    }) => {
    const {t, i18n} = useTranslation();
    let textProps:any = {};
    const hasKey = !!transKey;
    let valueComponent = null;
    if(hasKey){
        if(i18n.exists(transKey)){
            valueComponent = t(transKey);
            if(!isString(value)){
                if(i18n.exists(`${transKey}.__DEFAULT__`)){
                    valueComponent = <Trans>{`${transKey}.__DEFAULT__`}</Trans>;
                } else{
                    valueComponent = <Trans>{'TRANS_KEY_NOT_EXIST'}</Trans>
                }
            }
        } else{
            valueComponent = <Trans>{'TRANS_KEY_NOT_EXIST'}</Trans>
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
}

export {
    Text,
};

export default withTheme(Text);