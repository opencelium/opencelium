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

import React, {FC} from "react";
import {Spinner} from "reactstrap";
import {Size} from "@application/classes/Size";
import { IconProps } from "./interfaces";
import { MaterialIconStyled } from "./styles";
import {SpinnerStyled} from "../button/styles";

const Icon: FC<IconProps> =
    ({
        id,
        name,
        onClick,
        color,
        size,
        position,
        left,
        right,
        top,
        isLoading,
        styles,
        className,
    }) => {
    const isLabelHidden = !name && isLoading;
    if(isLoading){
        return(
            <SpinnerStyled className={className} left={left} top={top} size={size} color={color} position={position}>
                <Spinner type="grow" />
            </SpinnerStyled>
        )
    }
    if(name === ''){
        return null;
    }
    const instanceSize = new Size(size);
    return(
        <MaterialIconStyled
            id={id}
            className={`material-icons-round ${className}`}
            onClick={onClick}
            color={color}
            size={instanceSize.size}
            position={position}
            left={left}
            right={right}
            top={top}
            styles={styles}
        >
            {name}
        </MaterialIconStyled>
    )
}

Icon.defaultProps = {
    size: '20px',
    name: '',
    position: 'unset',
    styles: '',
}

export default Icon;