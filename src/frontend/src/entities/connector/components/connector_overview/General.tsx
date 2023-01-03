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
import {withTheme} from 'styled-components';
import {TextSize} from "@app_component/base/text/interfaces";
import Text from "@app_component/base/text/Text";
import {GeneralProps} from './interfaces';
import {ContentStyled, DescriptionStyled, HeaderStyled, SectionStyled, TitleStyled} from './styles';

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