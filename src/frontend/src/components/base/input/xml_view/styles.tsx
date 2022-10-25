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

import {ElementProps} from "../../input/interfaces";

const getReactXmlStyles = ({paddingLeft, paddingRight, width, isIconInside, hasIcon, marginTop, marginBottom, theme}: ElementProps) => {
    return {
        display: `inline-block`,
        outline: `none`,
        border: `none`,
        transition: `border-bottom-color 0.5s`,
        paddingLeft: `${paddingLeft || 0}`,
        paddingRight: `${paddingRight || 0}`,
        width: `${width || isIconInside || !hasIcon ? '100%' : `calc(100% - 50px)`}`,
        marginLeft: `${!hasIcon || isIconInside ? 0 : '30px'}`,
        marginTop: `${marginTop || 0}`,
        marginBottom: `${marginBottom || 0}`,
    };
}
export {
    getReactXmlStyles,
}