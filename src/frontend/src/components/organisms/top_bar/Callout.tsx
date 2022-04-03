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

import ReactDOM from "react-dom";
import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { CalloutProps } from './interfaces';
import {CalloutMessageStyled, CalloutStyled} from './styles';

const Callout: FC<CalloutProps> =
    ({
        message,
        icon,
        hasFoot,
    }) => {
    return ReactDOM.createPortal(
        <CalloutStyled hasFoot={hasFoot}>
            {icon}
            <CalloutMessageStyled hasFoot={hasFoot}>{message}</CalloutMessageStyled>
        </CalloutStyled>, document.getElementById('oc_callout')
    );
}

Callout.defaultProps = {
    hasFoot: true,
}


export {
    Callout,
};

export default withTheme(Callout);