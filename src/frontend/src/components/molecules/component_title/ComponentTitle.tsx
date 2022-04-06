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