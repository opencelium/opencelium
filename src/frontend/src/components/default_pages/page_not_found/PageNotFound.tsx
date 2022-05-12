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
import {Image} from "@app_component/base/image/Image";
import PageNotFoundImagePath from "@image/page_not_found.png";
import {ImageStyled, TitleStyled} from "./styles";

const PageNotFound: FC =
    ({

    }) => {
    return (
        <div>
            <TitleStyled>
                This Page not Found
            </TitleStyled>
            <ImageStyled>
                <Image src={PageNotFoundImagePath} width={72} height={72} alt={'Page not found'} />
            </ImageStyled>
        </div>
    )
}

PageNotFound.defaultProps = {
}


export {
    PageNotFound,
};
