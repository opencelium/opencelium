import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { WidgetTitleProps } from './interfaces';
import {WidgetTitleStyled} from './styles';
import {TextSize} from "@atom/text/interfaces";
import {ColorTheme} from "../../general/Theme";
import Text from "@atom/text/Text";

const WidgetTitle: FC<WidgetTitleProps> =
    ({
        title,
    }) => {
    return (
        <WidgetTitleStyled>
            <span>
                <Text
                    value={title}
                    size={TextSize.Size_20}
                    color={ColorTheme.Black}
                    isBold={true}
                />
            </span>
        </WidgetTitleStyled>
    )
}

WidgetTitle.defaultProps = {
}


export {
    WidgetTitle,
};

export default withTheme(WidgetTitle);