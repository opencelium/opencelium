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

import React, {FC} from 'react';

const DashedElement: FC<{hasDashAnimation: boolean, getElement: any, hasArrowAlert?: boolean, stroke?: string}> = ({ hasDashAnimation, getElement, hasArrowAlert, stroke }) => {
    const rectStyles: any = {};
    if(hasArrowAlert){
        rectStyles.stroke = '#d24545';
    } else{
        if(hasDashAnimation){
            rectStyles.animation = 'dash 15s linear infinite';
            rectStyles.strokeDasharray = 10;
            rectStyles.animationDirection = 'reverse';
            rectStyles.stroke = '#58854d';
        }
    }
    if(stroke){
        rectStyles.stroke = stroke;
    }
    return getElement({style: rectStyles});
}

DashedElement.defaultProps = {
    stroke: '',
}

export default DashedElement;