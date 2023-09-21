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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import InputSwitch from "@app_component/base/input/switch/InputSwitch";
import {ColorTheme} from "@style/Theme";
import {AggregatorAllActiveProps} from './interfaces';

const AggregatorAllActive: FC<AggregatorAllActiveProps> =
({
    isChecked,
    doSwitch,
}) => {
    return (
        <div style={{width: '150px', marginLeft: '85px', marginTop: '-5px'}}>
            <InputSwitch name={isChecked ? 'Hide Archived' : 'Show archived'} color={ColorTheme.Turquoise} isChecked={isChecked} position={'middle'} onClick={doSwitch}/>
        </div>
    );
}



export {
    AggregatorAllActive,
};

export default withTheme(AggregatorAllActive);
