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

import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import Text from "@app_component/base/text/Text";
import {TextSize} from "@app_component/base/text/interfaces";
import {ColorTheme} from "@style/Theme";
import { WidgetTitleProps } from './interfaces';
import {WidgetTitleStyled} from './styles';

const WidgetTitle: FC<WidgetTitleProps> =
    ({
        title,
        className,
    }) => {
    return (
        <WidgetTitleStyled className={className}>
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
    className: '',
}


export {
    WidgetTitle,
};

export default withTheme(WidgetTitle);