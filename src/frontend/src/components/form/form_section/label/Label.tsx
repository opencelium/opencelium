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
import {Text} from "@app_component/base/text/Text";
import {TextSize} from "@app_component/base/text/interfaces";
import {ColorTheme} from "@style/Theme";
import {LabelProps} from './interfaces';
import {LabelStyled} from './styles';
/*
* TODO: check everywhere the text (should be lang key)
*/
const Label: FC<LabelProps> =
    ({
        id,
        value,
        top,
        left,
        position,
        onClick,
        background,
    }) => {
    const labelProps: any = {};
    if(id){
        labelProps.id = `label_${id.toLowerCase()}`;
    }
    return (
        <LabelStyled background={background} onClick={onClick} top={top} left={left} position={position} {...labelProps}>
            <Text value={value} size={TextSize.Size_14} color={ColorTheme.White}/>
        </LabelStyled>
    )
}

Label.defaultProps = {
    background: '',
}


export {
    Label,
};

export default withTheme(Label);
