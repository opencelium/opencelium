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
import {Toast as ReactstrapToast, ToastHeader, ToastBody} from 'reactstrap';
import { ToastProps } from './interfaces';
import { ToastStyled } from './styles';

const Toast: FC<ToastProps> =
    ({
         header,
         body,
         left,
         top
    }) => {
    return (
        <ToastStyled >
            <ReactstrapToast style={{position: "absolute", left, top, zIndex: 1000000}}>
                <ToastHeader>
                    {header}
                </ToastHeader>
                <ToastBody>
                    {body}
                </ToastBody>
            </ReactstrapToast>
        </ToastStyled>
    )
}

Toast.defaultProps = {
}


export {
    Toast,
};

export default withTheme(Toast);