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
import InputJsonView from "@app_component/base/input/json_view/InputJsonView";
import {HeaderProps} from "../interfaces";


const Header: FC<HeaderProps> =
    ({
        updateHeader,
        readOnly,
        value,
        ...props
    }) => {
        return(
            <InputJsonView
                readOnly={readOnly}
                icon={'data_object'}
                label={'Header'}
                updateJson={updateHeader}
                jsonViewProps={{
                    name: false,
                    style: {marginBottom: '0px'},
                    collapsed: false,
                    src: value === null ? {} : value,
                }}
            />
        )
    }

Header.defaultProps = {
}


export {
    Header,
};
