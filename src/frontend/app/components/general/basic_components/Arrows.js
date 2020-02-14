/*
 * Copyright (C) <2020>  <becon GmbH>
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

import React from 'react';
import FontIcon from "./FontIcon";


/**
 * Arrow icon on the left
 */
export const ArrowLeft = (props) => (
    <FontIcon
        value={'arrow_back'}
        {...props}
    />
);

/**
 * Arrow icon on the right
 */
export const ArrowRight = (props) => (
    <FontIcon
        value={'arrow_forward'}
        {...props}
    />
);

/**
 * (not used) Arrow icon in both direction
 */
export const ArrowBoth = (props) => (
    <FontIcon
        value={'compare_arrows'}
        {...props}
    />
);
