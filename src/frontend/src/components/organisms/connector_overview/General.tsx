import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { GeneralProps } from './interfaces';
import {DescriptionStyled, SectionStyled, HeaderStyled, TitleStyled, ContentStyled} from './styles';
import {TextSize} from "@atom/text/interfaces";
import Text from "@atom/text/Text";

const General: FC<GeneralProps> =
    ({
        connector,
    }) => {
    return (
        <SectionStyled>
            <HeaderStyled>
                <Text value={'General'} size={TextSize.Size_20}/>
            </HeaderStyled>
            <ContentStyled>
                <TitleStyled>
                    <Text value={connector.title} size={TextSize.Size_20}/>
                </TitleStyled>
                <DescriptionStyled>
                    <Text value={connector.description} size={TextSize.Size_16}/>
                </DescriptionStyled>
            </ContentStyled>
        </SectionStyled>
    )
}

General.defaultProps = {
}


export {
    General,
};

export default withTheme(General);