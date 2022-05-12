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

import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import React from "react";

export const EditIcon = (props) => {
    return <TooltipFontIcon className={styles.edit_icon} tooltipPosition={'left'} size={14} isButton={true} tooltip={'Edit'} value={'edit'} onClick={props.onClick}/>;
}

export const ApplyIcon = (props) => {
    return <TooltipFontIcon className={styles.apply_icon} tooltipPosition={'left'} size={14} isButton={true} tooltip={'Apply'} value={'check'} onClick={props.onClick}/>;
}

export const CancelIcon = (props) => {
    return <TooltipFontIcon className={styles.cancel_icon} tooltipPosition={'left'} size={14} isButton={true} tooltip={'Cancel'} value={'close'} onClick={props.onClick}/>;
}

export const ViewIcon = (props) => {
    return <TooltipFontIcon className={styles.edit_icon} tooltipPosition={'left'} size={14} isButton={true} tooltip={'More'} value={'more_vert'} onClick={props.onClick}/>;
}

export const AssignIcon = (props) => {
    const {svgX, svgY, x, y, onClick} = props;
    return(
        <svg x={svgX} y={svgY} onClick={onClick}>
            <rect x="0" y="0" width="24" height="24" onClick={onClick} className={styles.process_assign_rect}/>
            <path id={'assign_icon'} className={styles.assign_icon} x={x} y={y} onClick={onClick} xmlns="http://www.w3.org/2000/svg" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z">
                <title>{'Assign'}</title>
            </path>
        </svg>
    )
}