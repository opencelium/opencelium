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

const DashedElement: FC<{hasDashAnimation: boolean, getElement: any}> = ({ hasDashAnimation, getElement}) => {
    const [dashAnimation, setDashAnimation] = useState<string>('4,8,4');
    let interval: any = null;
    useEffect(() => {
        if(hasDashAnimation){
            interval = setInterval(() => setDashAnimation((dashAnimation) => dashAnimation === '4,8,4' ? '2,4,2' : '4,8,4'), 150);
        } else{
            clearInterval(interval);
        }
    }, [hasDashAnimation])
    const rectStyles: any = {};
    if(hasDashAnimation){
        rectStyles.strokeDasharray = dashAnimation;
        rectStyles.stroke = '#58854d';
    }
    return getElement({style: rectStyles});
}

export default DashedElement;