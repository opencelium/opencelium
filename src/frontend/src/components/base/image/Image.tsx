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
import { ImageStyled } from './styles';
import {ImageProps} from "./interfaces";
import Icon from "../icon/Icon";

const Image: FC<ImageProps> =
    ({
        width,
        isLoading,
        loadingSize,
        ...props
    }) => {
    if(isLoading){
        return(
            <Icon name={''} isLoading={true} size={isLoading ? loadingSize : width}/>
        )
    }
    return (
        <ImageStyled width={width} {...props}/>
    )
}

Image.defaultProps = {
}


export {
    Image,
};
