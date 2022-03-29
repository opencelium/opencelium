import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { ComponentTitleProps } from './interfaces';
import {ComponentTitleStyled, IconStyled} from './styles';
import {TextSize} from "@atom/text/interfaces";
import {ColorTheme} from "../../general/Theme";
import Text from "@atom/text/Text";

const ComponentTitle: FC<ComponentTitleProps> =
    ({
        title,
        icon,
        marginLeft,
    }) => {
    return (
        <ComponentTitleStyled marginLeft={marginLeft}>
            <span>
                <Text
                    value={title}
                    size={TextSize.Size_20}
                    color={ColorTheme.DarkGray}
                />
                <IconStyled>{icon}</IconStyled>
            </span>
        </ComponentTitleStyled>
    )
}

ComponentTitle.defaultProps = {
    icon: null,
    marginLeft: '',
}


export {
    ComponentTitle,
};

export default withTheme(ComponentTitle);